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
          padding: "25px 30px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            marginBottom: 18,
          }}
        >
          🔔 <b>Nhật ký thông báo</b>
        </h1>

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 18,
            padding: "12px 20px",
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
            gap: 12,
            marginBottom: 20,
          }}
        >
          <input
            placeholder="🔎 Tìm tiêu đề hoặc nội dung..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              flex: 1,
              padding: 15,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 15,
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
            style={{
              width: 220,
              borderRadius: 12,
              border: "1px solid #ddd",
              padding: 12,
              fontSize: 15,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="review">
              Nhận xét hồ sơ
            </option>
            <option value="criteria">
              Tiêu chí hoàn thành
            </option>
            <option value="completed">
              Cập nhật tiêu chuẩn
            </option>
          </select>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 5px 20px rgba(0,0,0,.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead
              style={{
                background: "#dcecff",
              }}
            >
              <tr>
                <th style={th}>Tiêu đề</th>
                <th style={th}>Loại</th>
                <th style={th}>Thời gian</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Chi tiết</th>
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
                          marginBottom: 6,
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

                      {item.type === "completed" &&
                        "📋 Tiêu chuẩn"}
                    </td>

                    <td style={td}>
                      {new Date(
                        item.created_at
                      ).toLocaleString("vi-VN")}
                    </td>

                    <td style={td}>
                      {item.is_read ? (
                        <span
                          style={{
                            color: "#16a34a",
                            fontWeight: 600,
                          }}
                        >
                          Đã đọc
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#2563eb",
                            fontWeight: 600,
                          }}
                        >
                          Chưa đọc
                        </span>
                      )}
                    </td>

                    <td style={td}>
                      <Link
                        href={
                          item.target_url || "#"
                        }
                        style={{
                          color: "#2563eb",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        Xem →
                      </Link>
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