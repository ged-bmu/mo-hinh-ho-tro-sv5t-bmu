"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GraduationCap, House } from "lucide-react";
import Header from "../components/Header";
import CriteriaModal from "../components/CriteriaModal";

import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

type Message = {
  id: number;
  content: string;
  sender_role: "user" | "admin";
  created_at: string;
  is_read: boolean;
  reply_to?: number | null;
  file_url?: string | null;
  file_name?: string | null;
};
type Props = {
  user: any;
};

export default function StudentChat({
  user,
}: Props) {
  const [tab, setTab] = useState("proof");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showCriteria, setShowCriteria] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
    if (!user) return;

    loadConversation();
  }, [user]);

  async function loadConversation() {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
  await supabase
    .from("conversations")
    .update({
      unread_user: 0,
    })
    .eq("id", data.id);

  setConversationId(data.id);
  return;
}

    if (
      error &&
      error.code !== "PGRST116"
    ) {
      console.log(error);
      return;
    }

    const { data: created, error: createError } =
      await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
        })
        .select()
        .single();

    if (createError) {
      console.log(createError);
      return;
    }

    setConversationId(created.id);
  }

  /* -----------------------
      Load messages
  ------------------------ */

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();
  }, [conversationId]);

async function loadMessages() {
  const { data, error } =
    await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: false,
      })
      .limit(500);

  if (error) {
    console.log(error);
    return;
  }

  setMessages((data || []).reverse());
}
    /* -----------------------
      Đánh dấu đã đọc
  ------------------------ */

  useEffect(() => {
    if (!conversationId) return;

    markRead();
  }, [conversationId]);

  async function markRead() {
    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
      })
      .eq("conversation_id", conversationId)
      .eq("sender_role", "admin")
      .eq("is_read", false);

    if (error) {
      console.log(error);
    }
  }

  /* -----------------------
      Realtime
  ------------------------ */

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`student-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;

          setMessages((prev) => {
  const updated = [
    ...prev,
    msg,
  ];

  return updated.slice(-500);
});

          if (
            msg.sender_role === "admin"
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
    filter: `conversation_id=eq.${conversationId}`,
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
  }, [conversationId]);

  /* -----------------------
      Gửi tin nhắn
  ------------------------ */
console.log("FILE ĐANG CHỌN:", selectedFile);
async function sendMessage() {
  if (!conversationId) return;
  if (!message.trim() && !selectedFile) return;
console.log("BẮT ĐẦU GỬI");
  console.log("FILE:", selectedFile);
    const text = message;
    let fileUrl = null;
let fileName = null;


if (selectedFile) {

  const safeFileName = selectedFile.name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9.\-_]/g, "_");


const path = `${user.id}/${Date.now()}-${safeFileName}`;


console.log("BẮT ĐẦU UPLOAD");

const uploadResult = await supabase
  .storage
  .from("chat-files")
  .upload(path, selectedFile, {
    cacheControl: "3600",
    upsert: false,
  });

console.log("UPLOAD XONG");

console.log(uploadResult);

const uploadError = uploadResult.error;

  if (uploadError) {
    console.log(uploadError);
    alert("Upload file thất bại");
    return;
  }


const publicUrl = supabase
  .storage
  .from("chat-files")
  .getPublicUrl(path);

fileUrl = publicUrl.data.publicUrl;
fileName = selectedFile.name;

console.log("FILE URL:", fileUrl);
console.log("FILE NAME:", fileName);
}
    console.log("replyMessage =", replyMessage);

    setMessage("");
    setReplyMessage(null);
    setSelectedFile(null);

const { data, error } = await supabase
  .from("messages")
.insert({
  conversation_id: conversationId,
  sender_id: user.id,
  sender_role: "user",
  content: text,
  reply_to: replyMessage?.id ?? null,

  file_url: fileUrl,
  file_name: fileName,
})
  .select();

console.log("Inserted reply_to:", data?.[0]?.reply_to);
console.log(data?.[0]);
    if (error) {
      console.log(error);
      return;
    }

    await supabase
      .from("conversations")
      .update({
        last_message: text,
        last_message_at:
          new Date().toISOString(),
      })
      .eq("id", conversationId);

    await supabase.rpc(
      "increment_unread_admin",
      {
        conversation_id_input:
          conversationId,
      }
    );
  }
    return (
    <>
      <Header
        tab={tab}
        setTab={setTab}
        openCriteria={() =>
          setShowCriteria(true)
        }
      />

      <div className="flex h-[calc(100vh-80px)]">
        <main className="flex-1">
          <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden bg-slate-50 p-2 md:p-4">

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-3 py-3 md:px-6 md:py-4">

           <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 md:h-11 md:w-11">
    <GraduationCap size={22} />
  </div>

  <div>
    <h2 className="max-w-[180px] truncate text-sm font-semibold text-slate-800 md:max-w-none md:text-lg">
      CLB Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột
    </h2>

    <p className="hidden text-sm text-slate-500 md:mt-1 md:block">
      Kênh tư vấn và hỗ trợ sinh viên trong quá trình phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
    </p>
  </div>
</div>

              <button
  onClick={() =>
    (window.location.href = "/")
  }
  className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 md:px-4"
>
  <House size={16} />
  Trang chủ
</button>
            
            </div>

<ChatMessages
  messages={messages}
  bottomRef={bottomRef}
  viewerRole="user"
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

          </div>
          </div>
        </main>
      </div>

      {showCriteria && (
        <CriteriaModal
          onClose={() =>
            setShowCriteria(false)
          }
        />
      )}
    </>
  );
}