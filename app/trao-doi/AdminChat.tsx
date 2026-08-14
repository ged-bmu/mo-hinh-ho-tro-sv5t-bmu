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
  const [conversations, setConversations] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(true);

console.log("ADMIN SET FILE:", typeof setSelectedFile);

  const [selected, setSelected] =
    useState<any>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  
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
  // Lấy toàn bộ sinh viên
const {
  data: profiles,
  error: profileError,
} = await supabase
  .from("profiles")
  .select("id, ho_ten, lop");

  if (profileError) {
    console.log("Lỗi lấy sinh viên:", profileError);
    return;
  }

  // Lấy các cuộc trò chuyện đã tồn tại
  const {
    data: conversationData,
    error: conversationError,
  } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", {
      ascending: false,
    });

if (conversationError) {
  console.log("❌ LỖI TẠO CONVERSATION:", conversationError);
  alert(
    `Không tạo được cuộc trò chuyện:\n${conversationError.message}`
  );
  return;
}

  setConversations(conversationData || []);

  // Ghép conversation vào từng sinh viên
  const result = (profiles || []).map((profile) => {
    const conversation =
      conversationData?.find(
        (item) => item.user_id === profile.id
      );

    return {
      ...profile,

      // Có conversation hay chưa
      hasConversation: !!conversation,

      // Thông tin conversation
      conversationId: conversation?.id ?? null,
      last_message:
        conversation?.last_message ?? null,
      last_message_at:
        conversation?.last_message_at ?? null,
      unread_admin:
        conversation?.unread_admin ?? 0,

      // Giữ format cũ để code giao diện hiện tại không phải sửa quá nhiều
      profiles: profile,
    };
  });

const sortedResult = result.sort((a, b) => {
  // Cả hai đều có lịch sử chat → mới nhất lên trước
  if (a.last_message_at && b.last_message_at) {
    return (
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime()
    );
  }

  // Chỉ A có lịch sử chat → A lên trước
  if (a.last_message_at) return -1;

  // Chỉ B có lịch sử chat → B lên trước
  if (b.last_message_at) return 1;

  // Cả hai chưa chat → giữ theo tên
  return (a.ho_ten || "").localeCompare(
    b.ho_ten || "",
    "vi"
  );
});

setUsers(sortedResult);

  // Khôi phục cuộc trò chuyện đang chọn
  const saved =
    localStorage.getItem("admin_selected_chat");

  if (saved) {
    const savedChat = JSON.parse(saved);

    const found = result.find(
      (item) =>
        item.conversationId === savedChat.id ||
        item.id === savedChat.user_id
    );

    if (found?.hasConversation) {
      setSelected(found);
    }
  }
}
    /* -----------------------
      Load messages
  ------------------------ */

useEffect(() => {
  if (!selected?.conversationId) return;

  const conversationId = selected.conversationId;

  loadMessages(conversationId);
markRead(conversationId);

  const channel = supabase
    .channel(`admin-chat-${conversationId}`)
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
          // tránh bị thêm trùng
          if (prev.some((m) => m.id === msg.id)) {
            return prev;
          }

          return [...prev, msg];
        });

        if (msg.sender_role === "user") {
          markRead(conversationId);
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
}, [selected]);

async function loadMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.log("Lỗi load messages:", error);
    return;
  }

  setMessages(data || []);

  // Chỉ tự động xuống cuối khi vừa mở cuộc trò chuyện
  if (shouldScrollToBottomRef.current) {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });

      shouldScrollToBottomRef.current = false;
    });
  }
}

  /* -----------------------
      Đánh dấu đã đọc
  ------------------------ */

async function markRead(conversationId: string) {
  const { error: messageError } = await supabase
    .from("messages")
    .update({
      is_read: true,
    })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "user")
    .eq("is_read", false);

  if (messageError) {
    console.log(
      "Lỗi mark messages:",
      messageError
    );
    return;
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      unread_admin: 0,
    })
    .eq("id", conversationId);

  if (conversationError) {
    console.log(
      "Lỗi reset unread_admin:",
      conversationError
    );
  }

  // Cập nhật badge ngay trên sidebar
  setUsers((prev) =>
    prev.map((student) =>
      student.conversationId === conversationId
        ? {
            ...student,
            unread_admin: 0,
          }
        : student
    )
  );
}

  /* -----------------------
      Gửi tin nhắn
  ------------------------ */

async function sendMessage() {
  if (!selected) return;
  if (!message.trim() && !selectedFile) return;

  const text = message;

  let conversationId = selected.conversationId;

  // ==========================================
  // 1. CHƯA CÓ CONVERSATION → TẠO MỚI
  // ==========================================
  if (!conversationId) {
    const { data: newConversation, error: conversationError } =
      await supabase
        .from("conversations")
        .insert({
          user_id: selected.id,
          last_message: text || "Đã gửi một tệp",
          last_message_at: new Date().toISOString(),
          unread_user: 1,
          unread_admin: 0,
        })
        .select()
        .single();

    if (conversationError) {
      console.log(
        "Lỗi tạo conversation:",
        conversationError
      );
      return;
    }

    conversationId = newConversation.id;

    setSelected((prev: any) => ({
      ...prev,
      conversationId: newConversation.id,
      hasConversation: true,
    }));
  }

  // ==========================================
  // 2. SAU ĐÓ MỚI XÓA INPUT
  // ==========================================
  setMessage("");
  setReplyMessage(null);

  // LƯU FILE TRƯỚC KHI setSelectedFile(null)
  const fileToUpload = selectedFile;

  setSelectedFile(null);

  let fileUrl = null;
  let fileName = null;

  // ==========================================
  // 3. UPLOAD FILE
  // ==========================================
  if (fileToUpload) {
    const safeFileName = fileToUpload.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const path = `admin/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from("chat-files")
      .upload(path, fileToUpload);

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
    fileName = fileToUpload.name;
  }

  // ==========================================
  // 4. INSERT MESSAGE
  // ==========================================
  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_role: "admin",
      content: text,
      reply_to: replyMessage?.id ?? null,
      file_url: fileUrl,
      file_name: fileName,
    });

  if (error) {
    console.log("Lỗi gửi tin nhắn:", error);
    return;
  }

  // ==========================================
  // 5. CẬP NHẬT CONVERSATION
  // ==========================================
  await supabase
    .from("conversations")
    .update({
      last_message: text || "Đã gửi một tệp",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // ==========================================
  // 6. TĂNG UNREAD CHO SINH VIÊN
  // ==========================================
  await supabase.rpc("increment_unread_user", {
    conversation_id_input: conversationId,
  });

  // ==========================================
  // 7. GỬI NOTIFICATION
  // ==========================================
  await fetch("/api/send-notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "💬 Tin nhắn mới từ CLB SV5T",
      message: text || "Bạn có một tin nhắn mới.",
      userId: selected.user_id,
    }),
  });
}

return (
  <div
    className="
      fixed
      inset-0
      z-50
      flex
      h-[100dvh]
      w-full
      min-h-0
      overflow-hidden
      bg-[#f4f7fb]
    "
  >

    {/* =========================================================
        SIDEBAR
    ========================================================= */}
    <aside
  className={`
    absolute inset-y-0 left-0 z-40
    flex h-full min-h-0 w-[340px] flex-col
    border-r border-slate-200/80
    bg-white
    shadow-[4px_0_24px_rgba(15,23,42,0.04)]
    transition-transform duration-300

    md:static md:translate-x-0

    ${
      showSidebar
        ? "translate-x-0"
        : "-translate-x-full md:translate-x-0"
    }
  `}
>

      {/* Sidebar Header */}
      <div className="border-b border-slate-100 bg-white px-5 pb-4 pt-5">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-11 w-11 items-center justify-center
                rounded-2xl
                bg-gradient-to-br from-blue-600 to-indigo-600
                text-xl
                shadow-lg shadow-blue-500/20
              "
            >
              💬
            </div>

            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
                Hỗ trợ sinh viên
              </h1>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-400">
                  Trung tâm hỗ trợ
                </span>
              </div>
            </div>

          </div>

          <div
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl bg-slate-50
              text-slate-400
            "
            title={`${users.length} cuộc trò chuyện`}
          >
            <span className="text-sm font-bold">
              {users.length}
            </span>
          </div>

        </div>

        {/* Search */}
        {/* Search */}
<div className="relative mt-5">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Tìm kiếm cuộc trò chuyện..."
    className="
      h-10 w-full rounded-xl
      border border-slate-200
      bg-slate-50
      px-3
      text-sm text-slate-700
      outline-none
      transition
      placeholder:text-slate-400
      focus:border-blue-400
      focus:bg-white
      focus:ring-4
      focus:ring-blue-500/10
    "
  />
</div>
      </div>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {users.length === 0 ? (

          <div className="flex h-full flex-col items-center justify-center px-6 text-center">

            <div
              className="
                flex h-16 w-16 items-center justify-center
                rounded-2xl bg-slate-100
                text-3xl
              "
            >
              💬
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              Chưa có cuộc trò chuyện
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Khi sinh viên gửi tin nhắn,
              cuộc trò chuyện sẽ xuất hiện ở đây.
            </p>

          </div>

        ) : (

          <div className="py-2">

           {users
  .filter((item) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    const name =
      item.profiles?.ho_ten?.toLowerCase() ?? "";

    const lop =
      item.profiles?.lop?.toLowerCase() ?? "";

    const lastMessage =
      item.last_message?.toLowerCase() ?? "";

    return (
      name.includes(keyword) ||
      lop.includes(keyword) ||
      lastMessage.includes(keyword)
    );
  })
  .map((item) => {

              const isSelected =
                selected?.id === item.id;

              const name =
                item.profiles?.ho_ten ?? "Không rõ";

              const lop =
                item.profiles?.lop ?? "Chưa cập nhật";

              return (
                <button
                  key={item.id}
                  type="button"
onClick={() => {
  // Cho phép tự động xuống cuối khi vừa mở chat
  shouldScrollToBottomRef.current = true;

  setMessages([]);
  setSelected(item);

  localStorage.setItem(
    "admin_selected_chat",
    JSON.stringify({
      id: item.conversationId,
      user_id: item.id,
    })
  );

  setShowSidebar(false);

  setUsers((prev) =>
    prev.map((student) =>
      student.id === item.id
        ? {
            ...student,
            unread_admin: 0,
          }
        : student
    )
  );
}}
                  className={`
  group relative flex w-full
  gap-3 px-4 py-3
  text-left
  transition-all duration-200

  ${
    isSelected
      ? "bg-blue-50/80"
      : item.hasConversation
        ? "hover:bg-slate-50"
        : "opacity-60"
  }
`}
                >

                  {/* Active indicator */}
                  {isSelected && (
                    <div
                      className="
                        absolute left-0 top-2 bottom-2
                        w-1 rounded-r-full
                        bg-blue-600
                      "
                    />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">

                    <div
                      className={`
                        flex h-12 w-12
                        items-center justify-center
                        rounded-2xl
                        text-sm font-bold
                        ${
                          isSelected
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >
                      {name
                        .trim()
                        .split(/\s+/)
                        .slice(-2)
                        .map((x: string) =>
                          x[0]?.toUpperCase()
                        )
                        .join("")}
                    </div>

                    <span
                      className="
                        absolute bottom-0.5 right-0.5
                        h-3.5 w-3.5
                        rounded-full
                        border-2 border-white
                        bg-emerald-500
                      "
                    />

                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-2">

                      <div
                        className={`
                          truncate text-sm font-semibold
                          ${
                            isSelected
                              ? "text-blue-700"
                              : "text-slate-800"
                          }
                        `}
                      >
                        {name}
                      </div>

                      {item.unread_admin > 0 && (
                        <span
                          className="
                            flex h-5 min-w-5 shrink-0
                            items-center justify-center
                            rounded-full
                            bg-red-500
                            px-1.5
                            text-[10px]
                            font-bold
                            text-white
                            shadow-sm
                          "
                        >
                          {item.unread_admin > 99
                            ? "99+"
                            : item.unread_admin}
                        </span>
                      )}

                    </div>

                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {lop}
                    </div>

                    <div
  className={`
    mt-1 truncate text-xs
    ${
      item.unread_admin > 0
        ? "font-semibold text-slate-700"
        : "text-slate-400"
    }
  `}
>
  {item.hasConversation
    ? item.last_message || "Chưa có tin nhắn"
    : "Chưa trò chuyện"}
</div>

                  </div>

                </button>
              );
            })}

          </div>
        )}

      </div>

      {/* Sidebar footer */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg bg-blue-100
                text-sm
              "
            >
              🛡️
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700">
                Quản trị viên
              </p>

              <p className="text-[10px] text-slate-400">
                Đang trực tuyến
              </p>
            </div>

          </div>

          <div className="h-2 w-2 rounded-full bg-emerald-500" />

        </div>

      </div>

    </aside>


    {/* =========================================================
        MOBILE OVERLAY
    ========================================================= */}
    {showSidebar && (
      <div
        className="
          fixed inset-0 z-30
          bg-slate-900/30
          backdrop-blur-[2px]
          md:hidden
        "
        onClick={() => setShowSidebar(false)}
      />
    )}


    {/* =========================================================
        MAIN CHAT
    ========================================================= */}
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

      {selected ? (

        <>
          {/* =====================================================
              CHAT HEADER
          ===================================================== */}
          <header
            className="
              relative z-20
              flex h-[72px] shrink-0
              items-center
              border-b border-slate-200/80
              bg-white/95
              px-4
              shadow-sm
              backdrop-blur-xl
              md:px-6
            "
          >

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              className="
                mr-3 flex h-9 w-9
                items-center justify-center
                rounded-xl
                text-slate-500
                transition
                hover:bg-slate-100
                hover:text-blue-600
                md:hidden
              "
              aria-label="Mở danh sách trò chuyện"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>


            {/* Avatar */}
            <div className="relative shrink-0">

              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  from-blue-500 to-indigo-600
                  text-sm font-bold
                  text-white
                  shadow-md
                  shadow-blue-500/20
                "
              >
                {(selected.profiles?.ho_ten ??
                  "SV")
                  .trim()
                  .split(/\s+/)
                  .slice(-2)
                  .map((x: string) =>
                    x[0]?.toUpperCase()
                  )
                  .join("")}
              </div>

              <span
                className="
                  absolute bottom-0 right-0
                  h-3.5 w-3.5
                  rounded-full
                  border-2 border-white
                  bg-emerald-500
                "
              />

            </div>


            {/* User info */}
            <div className="ml-3 min-w-0">

              <div className="truncate text-[15px] font-bold text-slate-900">
                {selected.profiles?.ho_ten ??
                  "Không rõ"}
              </div>

              <div className="mt-0.5 flex items-center gap-2">

                <span className="truncate text-xs text-slate-400">
                  {selected.profiles?.lop ??
                    "Chưa cập nhật"}
                </span>

                <span className="h-1 w-1 rounded-full bg-slate-300" />
              </div>

            </div>


            {/* Header actions */}
            <div className="ml-auto flex items-center gap-1">

              <button
                type="button"
                className="
                  hidden h-9 w-9
                  items-center justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  sm:flex
                "
                title="Thông tin sinh viên"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 10v6" />
                  <path d="M12 7h.01" />
                </svg>
              </button>

              <button
                type="button"
                className="
                  hidden h-9 w-9
                  items-center justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  sm:flex
                "
                title="Tùy chọn"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="5" cy="12" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                </svg>
              </button>

            </div>

          </header>


          {/* =====================================================
              CHAT BODY
          ===================================================== */}
<div
  className="
    relative
    flex
    min-h-0
    flex-1
    flex-col
    overflow-hidden
    bg-[#f4f7fb]
  "
>

            {/* Background decoration */}
            <div
              className="
                pointer-events-none
                absolute inset-0 overflow-hidden
              "
            >
              <div
                className="
                  absolute -right-32 -top-32
                  h-72 w-72
                  rounded-full
                  bg-blue-100/30
                  blur-3xl
                "
              />

              <div
                className="
                  absolute -bottom-40 -left-40
                  h-80 w-80
                  rounded-full
                  bg-indigo-100/20
                  blur-3xl
                "
              />
            </div>


            {/* Messages */}
<div
  ref={messagesContainerRef}
  className="
    relative z-10
    min-h-0
    flex-1
    overflow-y-auto
    overscroll-y-contain
    touch-pan-y
    px-3 py-5
    sm:px-6
    md:px-8
  "
>
              <div className="mx-auto w-full max-w-[1400px]">

                {/* Welcome separator */}
                {messages.length === 0 && (
                  <div className="flex min-h-[55vh] items-center justify-center">

                    <div className="text-center">

                      <div
                        className="
                          mx-auto flex h-20 w-20
                          items-center justify-center
                          rounded-3xl
                          bg-white
                          text-4xl
                          shadow-xl
                          shadow-slate-200/60
                          ring-1 ring-slate-100
                        "
                      >
                        👋
                      </div>

                      <h2 className="mt-5 text-lg font-bold text-slate-700">
                        Bắt đầu hỗ trợ sinh viên
                      </h2>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                        Hãy gửi tin nhắn để trao đổi và
                        hỗ trợ sinh viên trong cuộc trò chuyện này.
                      </p>

                    </div>

                  </div>
                )}

<ChatMessages
  messages={messages}
  bottomRef={bottomRef}
  messagesContainerRef={messagesContainerRef}
  viewerRole="admin"
  onReply={(msg) => setReplyMessage(msg)}
  inputRef={inputRef}
/>

                <div ref={bottomRef} />

              </div>

            </div>

          </div>


          {/* =====================================================
              CHAT INPUT
          ===================================================== */}
          <div
            className="
              relative z-20
              shrink-0
              border-t border-slate-200/80
              bg-white
              px-3 pb-3 pt-2
              sm:px-5 sm:pb-4
              md:px-6
            "
          >

            <div className="mx-auto w-full max-w-[1400px]">

              {/* Reply preview */}
              {replyMessage && (
                <div
                  className="
                    mb-2 flex items-center
                    rounded-xl
                    border border-blue-100
                    bg-blue-50/70
                    px-3 py-2.5
                  "
                >

                  <div className="mr-3 h-8 w-1 rounded-full bg-blue-500" />

                  <div className="min-w-0 flex-1">

                    <div className="text-[11px] font-bold text-blue-600">
                      Đang trả lời
                    </div>

                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {replyMessage.content ||
                        "Tin nhắn đính kèm"}
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setReplyMessage(null)
                    }
                    className="
                      flex h-7 w-7
                      items-center justify-center
                      rounded-lg
                      text-slate-400
                      transition
                      hover:bg-white
                      hover:text-slate-700
                    "
                  >
                    ✕
                  </button>

                </div>
              )}

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

              <div className="mt-2 hidden px-1 sm:block">
                <span className="text-[10px] text-slate-400">
                  Tin nhắn được bảo mật · Hệ thống hỗ trợ SV5T BMU
                </span>
              </div>

            </div>

          </div>

        </>

      ) : (

        /* =======================================================
           EMPTY STATE
        ======================================================= */
        <div className="flex flex-1 items-center justify-center px-6">

          <div className="max-w-md text-center">

            <div
              className="
                mx-auto flex h-24 w-24
                items-center justify-center
                rounded-[28px]
                bg-gradient-to-br
                from-blue-500 to-indigo-600
                text-5xl
                shadow-2xl
                shadow-blue-500/20
              "
            >
              💬
            </div>

            <h2 className="mt-7 text-2xl font-bold tracking-tight text-slate-800">
              Trung tâm hỗ trợ sinh viên
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Chọn một cuộc trò chuyện ở bên trái
              để bắt đầu trao đổi với sinh viên.
            </p>

            <div className="mt-7 flex justify-center gap-3">

              <div
                className="
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-3
                  text-left
                  shadow-sm
                "
              >
                <div className="text-lg font-bold text-slate-800">
                  {users.length}
                </div>

                <div className="text-[11px] text-slate-400">
                  Cuộc trò chuyện
                </div>
              </div>

              <div
                className="
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-3
                  text-left
                  shadow-sm
                "
              >
                <div className="text-lg font-bold text-emerald-500">
                  ●
                </div>

                <div className="text-[11px] text-slate-400">
                  Hệ thống hoạt động
                </div>
              </div>

            </div>

          </div>

        </div>

      )}

    </main>
</div>
);
}