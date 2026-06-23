"use client";

export default function FileItem({
  file,
  url,
  onDelete,
  onRename,
}: {
  file: any;
  url: string;
  onDelete: () => void;
  onRename: (file: any) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "white",
        padding: "15px 20px",
        marginTop: "12px",
        borderRadius: "12px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>
          📄 {file.display_name || file.name}
        </span>

       <div
  style={{
    display: "flex",
    gap: "8px",
  }}
>
  <a
    href={url}
    target="_blank"
    style={{
      background: "#2563eb",
      color: "white",
      textDecoration: "none",
      padding: "6px 12px",
      borderRadius: "8px",
    }}
  >
    👁 Xem
  </a>

  <button
  onClick={() => onRename(file)}
  style={{
    background: "#2cfa25ed",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
  ✍️ Đổi tên
</button>
</div>
      </div>

      <button
        onClick={onDelete}
        style={{
          border: "none",
          background: "#ef4444",
          color: "white",
          padding: "8px 12px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        🗑 Xóa
      </button>
    </div>
  );
}