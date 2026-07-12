"use client";

export default function Spinner({
  size = 40,
}: {
  size?: number;
}) {
  const border = Math.max(2, Math.round(size / 10));

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `${border}px solid #e5e7eb`,
          borderTop: `${border}px solid #2563eb`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </>
  );
}