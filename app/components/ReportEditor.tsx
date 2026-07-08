"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ReportEditor({
  value,
  onChange,
}: Props) {
    const isFirstLoad = useRef(true);
  const editor = useEditor({
  extensions: [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
],
  content: "",

  immediatelyRender: false,

  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});
useEffect(() => {
  if (!editor) return;

  if (isFirstLoad.current && value) {
    editor.commands.setContent(value);
    isFirstLoad.current = false;
  }
}, [editor, value]);
  if (!editor) return null;

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "5px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            cursor: "pointer",
            background: editor.isActive("bold") ? "#2563eb" : "#fff",
            color: editor.isActive("bold") ? "#fff" : "#000",
            fontWeight: "bold",
          }}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            cursor: "pointer",
            background: editor.isActive("italic") ? "#2563eb" : "#fff",
            color: editor.isActive("italic") ? "#fff" : "#000",
            fontStyle: "italic",
          }}
        >
          I
        </button>
      </div>

      <EditorContent
  editor={editor}
  style={{
    maxHeight: "240px",
    overflowY: "auto",
    padding: "16px",
    lineHeight: "1.7",
    outline: "none",
  }}
/>
    </div>
  );
}