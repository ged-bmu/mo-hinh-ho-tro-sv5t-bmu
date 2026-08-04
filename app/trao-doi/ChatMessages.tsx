"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  content: string;
  sender_role: "user" | "admin";
  created_at: string;
  is_read: boolean;
  is_recalled?: boolean;
  reply_to?: number | null;

  file_url?: string | null;
  file_name?: string | null;
};

type Props = {
  messages: Message[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  viewerRole: "user" | "admin";
  onReply: (msg: Message) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
};

export default function ChatMessages({
  messages,
  bottomRef,
  viewerRole,
  onReply,
  inputRef,
}: Props) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<Message | null>(null);

  const messageMap = useMemo(() => {
    return new Map(messages.map((m) => [m.id, m]));
  }, [messages]);

  async function recallMessage(id: number) {
    await supabase
      .from("messages")
      .update({
        is_recalled: true,
        content: "",
        file_url: null,
        file_name: null,
      })
      .eq("id", id);

    setOpenMenu(null);
  }

  function handleReply(msg: Message) {
    onReply(msg);
    inputRef.current?.focus();
    setOpenMenu(null);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 md:px-6 md:py-5">
      <div className="space-y-5">

        {messages.map((msg) => {
          console.log("TIN NHẮN:", msg);
          const isMe = msg.sender_role === viewerRole;
          const isAdminMessage = msg.sender_role === "admin";
          const repliedMessage = msg.reply_to
            ? messageMap.get(msg.reply_to)
            : undefined;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-1 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {isMe && (
                <MessageMenu
  open={openMenu === msg.id}
  onToggle={() =>
    setOpenMenu(openMenu === msg.id ? null : msg.id)
  }
  onClose={() => setOpenMenu(null)}
>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => handleReply(msg)}
                  >
                    ↩ Phản hồi
                  </button>

                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => recallMessage(msg.id)}
                  >
                    ↩️ Thu hồi tin nhắn
                  </button>
                </MessageMenu>
              )}

              <div
                className={`flex max-w-[85%] md:max-w-[75%] flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
              {/* Reply */}
{repliedMessage && (
  <div className="mb-2 border-l-2 pl-2 text-xs opacity-80">
    <div className="font-semibold">
      {repliedMessage.sender_role === viewerRole
        ? "Đã phản hồi tin nhắn của bạn"
        : "Đã phản hồi"}
    </div>

    <div className="truncate">
      {repliedMessage.is_recalled
        ? "Tin nhắn đã thu hồi"
        : repliedMessage.content}
    </div>
  </div>
)}

{/* Text message */}
{msg.content && (
  <div
    className={`max-w-[420px] break-words whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
      isMe
        ? "bg-blue-600 text-white"
        : "border border-blue-100 bg-white text-slate-700"
    }`}
  >
    {msg.content}
  </div>
)}


{/* File / Image */}
{msg.file_url && (
  <div className="mt-2">

    {msg.file_name?.match(
      /\.(jpg|jpeg|png|gif|webp)$/i
    ) ? (
      <img
        src={msg.file_url}
        alt=""
        onClick={() => setPreviewFile(msg)}
        className="max-w-[220px] md:max-w-[250px]cursor-pointer rounded-xl"
      />
    ) : (
      <button
        onClick={() => setPreviewFile(msg)}
        className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm text-blue-600 shadow-sm"
      >
        📎 {msg.file_name}
      </button>
    )}

  </div>
)}

                <span className="mt-1 text-[10px] text-gray-400">
                  {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {!isMe && (
                <MessageMenu
  open={openMenu === msg.id}
  left
  onToggle={() =>
    setOpenMenu(openMenu === msg.id ? null : msg.id)
  }
  onClose={() => setOpenMenu(null)}
>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => handleReply(msg)}
                  >
                    ↩ Phản hồi
                  </button>
                </MessageMenu>
              )}
            </div>
          );
        })}
        {previewFile && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
    onClick={() => setPreviewFile(null)}
  >

   <div
  className="flex w-full max-w-[95vw] max-h-[90vh] flex-col rounded-xl bg-white p-3 md:w-auto md:max-w-[90vw] md:p-4"
  onClick={(e) => e.stopPropagation()}
>

      {/* Header */}
    <div className="mb-3 flex items-center justify-between border-b pb-3">

  <div className="max-w-[70vw] truncate font-medium text-gray-700">
    {previewFile.file_name}
  </div>

  <button
    onClick={() => setPreviewFile(null)}
    className="rounded-lg px-3 py-1 text-red-500 hover:bg-red-50"
  >
    ✕
  </button>

</div>


      {/* Preview */}
      {previewFile.file_name?.match(
        /\.(jpg|jpeg|png|gif|webp)$/i
      ) ? (
        <img
          src={previewFile.file_url!}
          className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain"
        />
      ) : (
        <iframe
          src={`${previewFile.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="h-[80vh] w-[80vw] rounded-lg"
          title="PDF Preview"
        />
      )}

    </div>

  </div>
)}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

type MenuProps = {
  open: boolean;
  left?: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
};

function MessageMenu({
  open,
  left,
  onToggle,
  onClose,
  children,
}: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      open &&
      menuRef.current &&
      !menuRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, [open, onClose]);
  return (
    <div
  ref={menuRef}
  className="relative flex w-3 justify-center self-start pt-2"
>
      <button
        onClick={onToggle}
        className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-black"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          className={`absolute bottom-8 z-10 w-40 rounded-lg bg-white py-1 shadow-lg ${
            left ? "left-0" : "right-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}