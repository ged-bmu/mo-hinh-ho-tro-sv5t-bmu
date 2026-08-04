"use client";

import {
  Paperclip,
  Image as ImageIcon,
  Send,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  content: string;
  sender_role: "user" | "admin";
  created_at: string;
  is_read: boolean;
  is_recalled?: boolean;
};

type Props = {
  message: string;
  setMessage: (value: string) => void;
  sendMessage: () => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  replyMessage: Message | null;
  setReplyMessage: (value: Message | null) => void;

  inputRef: React.RefObject<HTMLTextAreaElement | null>;
};

export default function ChatInput({
  message,
  setMessage,
 sendMessage,
replyMessage,
setReplyMessage,
inputRef,
selectedFile,
setSelectedFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;

    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
          alert("Ảnh tối đa 25MB");
          return;
        }

        const imageFile = new File(
          [file],
          `screenshot-${Date.now()}.png`,
          {
            type: file.type,
          }
        );

        setSelectedFile(imageFile);
        break;
      }
    }
  }

  window.addEventListener(
    "paste",
    handlePaste
  );

  return () => {
    window.removeEventListener(
      "paste",
      handlePaste
    );
  };
}, [setSelectedFile]);
  return (
    <div className="border-t bg-white p-2 md:p-3">
        {replyMessage && (
  <div className="mb-3 rounded-lg border-l-4 border-blue-500 bg-gray-100 p-3">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold text-blue-600">
        {replyMessage.sender_role === "user"
          ? "Sinh viên"
          : "CLB SV5T"}
      </div>

      <button
        onClick={() => setReplyMessage(null)}
        className="text-gray-500 hover:text-red-500"
      >
        ✕
      </button>
    </div>

<div className="mt-1 w-full overflow-hidden text-sm text-gray-600 whitespace-pre-wrap break-all">
  {replyMessage.content}
</div>
  </div>
)}
{selectedFile && (
  <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
    <div className="flex items-center gap-2 truncate">
      {selectedFile.type.startsWith("image/") ? (
        <img
          src={URL.createObjectURL(selectedFile)}
          className="h-10 w-10 rounded-lg object-cover"
        />
      ) : (
        <span>📎</span>
      )}

      <span className="max-w-[250px] truncate text-sm">
        {selectedFile.name}
      </span>
    </div>

<button
  onClick={() => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }}
  className="text-red-500"
>
  ✕
</button>
  </div>
)}
      <div className="grid w-full grid-cols-[36px_36px_minmax(0,1fr)_44px] items-end gap-1 md:flex md:gap-2">

        <button
  onClick={() =>
    fileInputRef.current?.click()
  }
  className="rounded-full p-1 md:p-2 transition hover:bg-gray-100"
>
  <Paperclip size={18} />
</button>

       <button
  onClick={() =>
    imageInputRef.current?.click()
  }
  className="rounded-full p-1 md:p-2 transition hover:bg-gray-100"
>
  <ImageIcon size={18} />
</button>
<input
  ref={fileInputRef}
  type="file"
  hidden
  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
onChange={(e)=>{
  const file = e.target.files?.[0];

  if(!file) return;

  if(file.size > 25 * 1024 * 1024){
    alert("File tối đa 25MB");
    return;
  }

  setSelectedFile(file);
  e.target.value = "";
}}
/>


<input
  ref={imageInputRef}
  type="file"
  accept="image/*"
  hidden
 onChange={(e)=>{
  const file = e.target.files?.[0];

  if(!file) return;

  if(file.size > 25 * 1024 * 1024){
    alert("File tối đa 25MB");
    return;
  }

  setSelectedFile(file);
  e.target.value = "";
}}
/>
       <textarea
  ref={inputRef}
  rows={1}
  value={message}
  placeholder="Nhập tin nhắn..."
  onChange={(e) =>
    setMessage(e.target.value)
  }
  onKeyDown={(e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      sendMessage();
    }
  }}
  className="
    min-w-0
    w-full
    min-h-[42px] md:min-h-[44px]
    max-h-32
    resize-none
    rounded-2xl
    border
    border-gray-200
    px-4
    py-3
    outline-none
    focus:border-blue-500
  "
/>

        <button
  onClick={()=>{
    console.log("CLICK GỬI");
    sendMessage();
  }}
          disabled={!message.trim() && !selectedFile}
          className={`
            rounded-full
            p-2 md:p-3
            transition
            ${
  message.trim() || selectedFile
    ? "bg-blue-500 text-white hover:bg-blue-600"
    : "cursor-not-allowed bg-gray-200 text-gray-400"
}
          `}
        >
          <Send size={18} />
        </button>

      </div>
    </div>
  );
}