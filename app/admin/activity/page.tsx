"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import Spinner from "../../components/Spinner";
import AdminSidebar from "../../components/AdminSidebar";
import NotificationBell from "../../components/NotificationBell";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] =
    useState("");
     const menuStyle = {
  display: "block",
  padding: "12px 12px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#1e293b",
  marginBottom: "10px",
  background: "#f8fafc",
  fontWeight: 500,
};
  const [showSidebar, setShowSidebar] = useState(false);
  const [filter, setFilter] =
    useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);

    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });
     
    setLogs(data || []);
    setLoading(false);
  }

  const filteredLogs =
    logs.filter((log) => {
      const matchKeyword =
        !keyword ||
        log?.ho_ten
          ?.toLowerCase()
          .includes(
            keyword.toLowerCase()
          ) ||
        log?.lop
          ?.toLowerCase()
          .includes(
            keyword.toLowerCase()
          ) ||
        log?.target_file
          ?.toLowerCase()
          .includes(
            keyword.toLowerCase()
          );

      const matchFilter =
        filter === "all"
          ? true
          : log.action_type ===
            filter;

      return (
        matchKeyword &&
        matchFilter
      );
    });

  return (
    <div
      style={{
        padding: "30px",
      }}
    >
       <AdminSidebar />
       <NotificationBell />
 <Link
      href="/admin"
      style={{
        display: "inline-flex",
        marginLeft: "50px",
        gap: "24px",
        alignItems: "flex-start",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "10px 16px",
        borderRadius: "12px",
        textDecoration: "none",
        color: "#334155",
        fontWeight: 600,
        marginBottom: "10px",
      }}
    >
      ← Trang chủ
    </Link>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          value={keyword}
          onChange={(e) =>
            setKeyword(
              e.target.value
            )
          }
          placeholder="🔎 Tìm sinh viên, lớp hoặc tên file..."
          style={{
            flex: 1,
            padding: "12px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
          }}
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(
              e.target.value
            )
          }
          style={{
            padding: "12px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <option value="all">
            Tất cả
          </option>

          <option value="upload">
            Tải lên
          </option>

          <option value="rename">
            Đổi tên
          </option>

          <option value="delete">
            Xóa
          </option>
        </select>
      </div>

     {loading && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
    }}
  >
    <Spinner />
  </div>
)}

      {!loading && (
        <div
          style={{
            background:
              "white",
            borderRadius:
              "12px",
            overflow:
              "hidden",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
  style={{
    overflowX: "auto",
  }}
>
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#dbeafe",
                }}
              >
                <th
                  style={
                    thStyle
                  }
                >
                  Sinh viên
                </th>

                <th
                  style={
                    thStyle
                  }
                >
                  Lớp
                </th>

                <th
                  style={
                    thStyle
                  }
                >
                  Hành động
                </th>

                <th
                  style={
                    thStyle
                  }
                >
                  File
                </th>

                <th
                  style={
                    thStyle
                  }
                >
                  Thư mục
                </th>

                <th
                  style={
                    thStyle
                  }
                >
                  Thời gian
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map(
                (
                  log,
                  index
                ) => (
                  <tr
                    key={
                      index
                    }
                  >
                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        log.ho_ten
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        log.lop
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {log.action_type ===
                        "upload" &&
                        "📤 Tải lên"}

                      {log.action_type ===
                        "rename" &&
                        "✏️ Đổi tên"}

                      {log.action_type ===
                        "delete" &&
                        "🗑️ Xóa"}
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        log.target_file
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        log.target_folder
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {new Date(
                        log.created_at
                      ).toLocaleString(
                        "vi-VN"
                      )}
                    </td>
                  </tr>
                )
              )}

              {filteredLogs.length ===
                0 && (
                <tr>
                  <td
                    colSpan={
                      6
                    }
                    style={{
                      padding:
                        "20px",
                      textAlign:
                        "center",
                    }}
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "12px",
  borderTop:
    "1px solid #eee",
};