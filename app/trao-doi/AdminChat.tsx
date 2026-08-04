"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import Link from "next/link";

type Message = {
  id: number;
  content: string;
  sender_role: "user" | "admin";
  created_at: string;
  is_read: boolean;
  is_recalled?: boolean;
  reply_to?: number | null;
};

export default function AdminChat() {
  const [users, setUsers] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [showSidebar, setShowSidebar] = useState(true);

console.log("ADMIN SET FILE:", typeof setSelectedFile);

  const [selected, setSelected] =
    useState<any>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  /* -----------------------
      Load conversations
  ------------------------ */

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

async function loadConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", {
      ascending: false,
    });

  console.log("CONVERSATIONS:", data);
  console.log("ERROR:", error);

  if (error) {
    console.log(error);
    return;
  }

  const userIds = data.map((item) => item.user_id);

const { data: profiles } = await supabase
  .from("profiles")
  .select("id, ho_ten, lop")
  .in("id", userIds);

const result = data.map((item) => ({
  ...item,
  profiles: profiles?.find(
    (p) => p.id === item.user_id
  ),
}));

setUsers(result);
const saved = localStorage.getItem("admin_selected_chat");

if (saved) {
  const savedChat = JSON.parse(saved);

  const found = result.find(
    (item) => item.id === savedChat.id
  );

  if (found) {
    setSelected(found);
  }
}
}
    /* -----------------------
      Load messages
  ------------------------ */

  useEffect(() => {
    if (!selected) return;

    loadMessages();
    markRead();

    const channel = supabase
      .channel(`admin-${selected.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selected.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;

          setMessages((prev) => [
            ...prev,
            msg,
          ]);

          if (
            msg.sender_role === "user"
          ) {
            markRead();
          }
        }
      )
      .on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "messages",
    filter: `conversation_id=eq.${selected.id}`,
  },
  (payload) => {
    const updated = payload.new as Message;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === updated.id ? updated : m
      )
    );
  }
)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected]);

  async function loadMessages() {
    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .eq(
          "conversation_id",
          selected.id
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.log(error);
      return;
    }

    setMessages(data || []);

setTimeout(() => {
  bottomRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, 100);
  }

  /* -----------------------
      Đánh dấu đã đọc
  ------------------------ */

  async function markRead() {
    const { error } =
      await supabase
        .from("messages")
        .update({
          is_read: true,
        })
        .eq(
          "conversation_id",
          selected.id
        )
        .eq(
          "sender_role",
          "user"
        )
        .eq(
          "is_read",
          false
        );

    if (error) {
      console.log(error);
    }
  }

  /* -----------------------
      Gửi tin nhắn
  ------------------------ */

  async function sendMessage() {
    if (!selected) return;
    if (!message.trim() && !selectedFile) return;

    const text = message;
    setMessage("");
    setReplyMessage(null);
    setSelectedFile(null);
    let fileUrl = null;
let fileName = null;

if (selectedFile) {

  const safeFileName = selectedFile.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");

  const path = `admin/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase
    .storage
    .from("chat-files")
    .upload(path, selectedFile);

  if (uploadError) {
    console.log(uploadError);
    alert("Upload thất bại");
    return;
  }

  const publicUrl = supabase
    .storage
    .from("chat-files")
    .getPublicUrl(path);

  fileUrl = publicUrl.data.publicUrl;
  fileName = selectedFile.name;
}
const {
  data: { user },
} = await supabase.auth.getUser();

const { error } =
  await supabase
    .from("messages")
    .insert({
      conversation_id: selected.id,
      sender_role: "admin",
      content: text,
      reply_to: replyMessage?.id ?? null,
      file_url: fileUrl,
      file_name: fileName,
    });
if (!error) {
  await supabase.rpc("increment_unread_user", {
    conversation_id_input: selected.id,
  });
}
if (error) {
  console.log(error);
  return;
}
  }
  useEffect(() => {
  const saved = localStorage.getItem("admin_selected_chat");

  if (saved) {
    setSelected(JSON.parse(saved));
  }
}, []);
    return (
    <div className="relative flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50">

      {/* Sidebar */}
      <div
className={`
absolute inset-y-0 left-0 z-30 w-full bg-white
border-r transition-transform duration-300

md:static md:w-80 md:translate-x-0

${
  showSidebar
    ? "translate-x-0"
    : "-translate-x-full md:translate-x-0"
}
`}
>

        <div className="
border-b
px-4
py-4
text-lg
font-bold
text-slate-800
">
  
💬 Hỗ trợ sinh viên
</div>

        {users.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            Chưa có cuộc trò chuyện
          </div>
        )}

        {users.map((item) => (
          <div
            key={item.id}
onClick={() => {
  console.log("CLICK USER:", item);
  setMessages([]);
  setSelected(item);

localStorage.setItem(
  "admin_selected_chat",
  JSON.stringify(item)
);

setShowSidebar(false);
}}
            
            className={`
cursor-pointer
border-b
px-4
py-3
transition
hover:bg-blue-50

${
selected?.id === item.id
? "bg-blue-50"
: "bg-white"
}
`}
          >
            
            <div className="flex items-center justify-between">

              <div>

                <div className="font-semibold">
                 {item.profiles?.ho_ten ?? "Không rõ"}
                </div>

                <div className="text-sm text-gray-500">
                  {item.profiles?.lop}
                </div>

              </div>

              {item.unread_admin > 0 && (
                <div
                  className="
                    flex
                    h-6
                    w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {item.unread_admin}
                </div>
              )}

            </div>

            <div className="mt-2 truncate text-sm text-gray-500">
              {item.last_message}
            </div>

          </div>
        ))}

      </div>

      {/* Chat */}

      <div className="
flex
min-w-0
flex-1
flex-col
bg-slate-100
">

        {selected ? (
          <>

<div
  className="
relative
flex
items-center
border-b
bg-white
px-4
py-3
shadow-sm
"
>
  <Link
    href="/admin"
    className="
      mr-3
      flex
      h-9
      items-center
      rounded-lg
      border
      border-slate-200
      px-3
      text-sm
      font-medium
      text-slate-700
      hover:bg-slate-100
    "
  >
    ← Trang chủ
  </Link>

  <button
    onClick={() => setShowSidebar(true)}
    className="
      absolute
      left-3
      top-1/2
      -translate-y-1/2
      md:hidden
      flex
      h-8
      w-8
      items-center
      justify-center
      rounded-full
      text-lg
      hover:bg-slate-100
    "
  >
    ☰
  </button>


  <div className="
    ml-10
    flex
    flex-col
  ">
    <div className="font-bold text-sm">
      {selected.profiles?.ho_ten}
    </div>

    <div className="text-xs text-gray-500">
      {selected.profiles?.lop}
    </div>
  </div>

</div>
<ChatMessages
  messages={messages}
  bottomRef={bottomRef}
  viewerRole="admin"
  onReply={setReplyMessage}
  inputRef={inputRef}
/>

<ChatInput
  message={message}
  setMessage={setMessage}
  sendMessage={sendMessage}
  selectedFile={selectedFile}
  setSelectedFile={setSelectedFile}
  replyMessage={replyMessage}
  setReplyMessage={setReplyMessage}
  inputRef={inputRef}
/>

          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            Chọn một cuộc trò chuyện để bắt đầu.
          </div>
        )}

      </div>

    </div>
  );
}