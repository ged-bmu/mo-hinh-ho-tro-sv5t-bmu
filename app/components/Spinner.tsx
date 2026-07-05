"use client";

export default function Spinner() {
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
          width: "40px",
          height: "40px",
          border: "4px solid #e5e7eb",
          borderTop: "4px solid #2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </>
  );
}