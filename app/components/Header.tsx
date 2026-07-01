"use client";

type HeaderProps = {
  tab: string;
  setTab: (tab: string) => void;
  openCriteria: () => void;
};

export default function Header({
  tab,
  setTab,
  openCriteria,
}: HeaderProps) {
  return (
    <header
      style={{
        background: "#fff",
        padding: "14px 28px",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <img
          src="/logo-header.png"
          alt="Logo"
          style={{
            height: 55,
            cursor: "pointer",
          }}
          onClick={() => window.location.href = "/"}
        />

 <img
    src="/Tenhethong.png"
    style={{
      height: "48px",
      objectFit: "contain",
    }}
  />
        <div
          style={{
            display: "flex",
            gap: 15,
          }}
        >
                  <button
            onClick={openCriteria}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
              transition: ".2s",
              background: "#0055ff",
              color: "#ffffff",
            }}
          >
            📑 Xem tiêu chí
          </button>
        </div>
      </div>
    </header>
  );
}