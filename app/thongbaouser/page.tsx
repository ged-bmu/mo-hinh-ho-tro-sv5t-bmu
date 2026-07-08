"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CriteriaModal from "../components/CriteriaModal";
import BellUserTemp from "../components/BellUserTemp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function ThongBaoUser() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [keyword, setKeyword] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();

  window.addEventListener("resize", checkMobile);

  return () => {
    window.removeEventListener("resize", checkMobile);
  };
}, []);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
    
  }, []);

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      const okKeyword =
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.content.toLowerCase().includes(keyword.toLowerCase());

      const okType =
        typeFilter === "all" || item.type === typeFilter;

      return okKeyword && okType;
    });
  }, [notifications, keyword, typeFilter]);

 return (
       <div
         style={{
           minHeight: "100vh",
           display: "flex",
           flexDirection: "column",
         }}
       >
       
                <Header
           tab={tab}
           setTab={setTab}
           openCriteria={() => setShowCriteria(true)}
         />
         
         <div
           style={{
             display: "flex",
             flex: 1,
           }}
         >
       
           <Sidebar />

      <main
        style={{
          flex: 1,
           padding: isMobile ? 16 : "25px 30px",
        }}
      >
        <h1
          style={{
            fontSize:isMobile ? 22 : 24,
            marginBottom: isMobile ? 12 : 18,
          }}
        >
          🔔 <b>Nhật ký thông báo</b>
        </h1>

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: isMobile ? 10 : 18,
            padding:isMobile ? "10px 14px" : "12px 20px",
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fff",
            textDecoration: "none",
            color: "#222",
            fontWeight: 600,
          }}
        >
          ← Trang chủ
        </Link>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            marginBottom: isMobile ? 12 : 20,
          }}
        >
          <input
            placeholder="🔎 Tìm tiêu đề hoặc nội dung..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              flex: 1,
              width: "100%",
              padding: isMobile ? "11px 14px" : 15,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 15,
            }}
          />

<select
  value={typeFilter}
  onChange={(e) => setTypeFilter(e.target.value)}
  style={{
    width: isMobile ? "100%" : 220,
    padding: isMobile ? "10px 14px" : "14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: isMobile ? 15 : 16,
    height: isMobile ? 38 : 54,
  }}
>
  <option value="all">Tất cả</option>

  <option value="review">
    Nhận xét hồ sơ
  </option>

  <option value="criteria">
    Tiêu chí hoàn thành
  </option>

  <option value="criteria_update">
    Cập nhật tiêu chuẩn
  </option>
</select>
        </div>

        <div
          style={{
            marginTop: isMobile ? 6 : 0,
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            WebkitOverflowScrolling:"touch",
            boxShadow:"0 5px 20px rgba(0,0,0,.06)"
              
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead
              style={{
                background: "#dcecff",
                padding: isMobile ? "10px 8px" : "18px",
                fontSize: isMobile ? "14px" : 18,
              }}
            >
              <tr>
  <th style={{ ...th, width: "55%" }}>Tiêu đề</th>
  <th style={{ ...th, width: "20%" }}>Loại</th>
  <th style={{ ...th, width: "25%" }}>Thời gian</th>
</tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 30,
                      textAlign: "center",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      background: item.is_read
                        ? "#fff"
                        : "#eef6ff",
                      borderBottom:
                        "1px solid #eee",
                    }}
                  >
                    <td style={td}>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: isMobile ? 3 : 6,
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          color: "#666",
                        }}
                      >
                        {item.content}
                      </div>
                    </td>

                    <td style={td}>
                      {item.type === "review" &&
                        "📝 Nhận xét"}

                      {item.type === "criteria" &&
                        "✅ Đánh giá"}

                      {item.type === "criteria_update" &&
                        "📋 Tiêu chuẩn"}
                    </td>

                    <td style={td}>
                      {new Date(
                        item.created_at
                      ).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}

              {!loading &&
                filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 30,
                        textAlign: "center",
                      }}
                    >
                      Không có thông báo.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
     {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}
                <Footer />
              </div>
              );
            }

const th = {
  padding: "16px",
  textAlign: "left" as const,
  fontSize: 15,
};

const td = {
  padding: "16px",
  verticalAlign: "top" as const,
};