"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { authFetch } from "@/lib/auth-fetch";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SidebarChutichhsv from "../../chutichhsv/sidebarchutichhsv/page";
import Spinner from "../../components/Spinner";

export default function AccountsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // ===============================
  // FORM TẠO TÀI KHOẢN
  // ===============================

  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chuTich, setChuTich] = useState(false);
  const [bch, setBch] = useState(false);
  const [creating, setCreating] = useState(false);

  // ===============================
  // DANH SÁCH TÀI KHOẢN
  // ===============================

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // ===============================
  // MODAL SỬA
  // ===============================

  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editHoTen, setEditHoTen] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ===============================
  // KIỂM TRA QUYỀN
  // ===============================

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/introduce";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (profile?.roles?.includes("chu_tich_hsv")) {
      setAllowed(true);
      await loadAccounts();
    } else {
      alert("Bạn không có quyền truy cập.");
      window.location.href = "/admin";
      return;
    }

    setLoading(false);
  }

  // ===============================
  // TẢI DANH SÁCH
  // ===============================

  async function loadAccounts() {
    setLoadingAccounts(true);

    try {
      const response = await authFetch("/api/admin/accounts");

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        return;
      }

      setAccounts(result.accounts || []);
    } catch (error) {
      console.error("Lỗi tải danh sách tài khoản:", error);
    } finally {
      setLoadingAccounts(false);
    }
  }

  // ===============================
  // TẠO TÀI KHOẢN
  // ===============================

  async function createAccount() {
    if (!hoTen.trim() || !email.trim() || !password) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const roles: string[] = [];

    if (chuTich) {
      roles.push("chu_tich_hsv");
    }

    if (bch) {
      roles.push("bch_hsv");
    }

    if (roles.length === 0) {
      alert("Vui lòng chọn ít nhất một vai trò.");
      return;
    }

    setCreating(true);

    try {
      const response = await authFetch(
        "/api/admin/create-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ho_ten: hoTen.trim(),
            email: email.trim(),
            password,
            roles,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Không thể tạo tài khoản.");
        return;
      }

      alert("Tạo tài khoản thành công.");

      setHoTen("");
      setEmail("");
      setPassword("");
      setChuTich(false);
      setBch(false);

      await loadAccounts();
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi.");
    } finally {
      setCreating(false);
    }
  }

  // ===============================
  // MỞ MODAL SỬA
  // ===============================

  function openEditModal(account: any) {
    setEditingAccount(account);
    setEditHoTen(account.ho_ten || "");
    setEditEmail(account.email || "");
    setEditPassword("");
  }

  // ===============================
  // ĐÓNG MODAL
  // ===============================

  function closeEditModal() {
    if (savingEdit) return;

    setEditingAccount(null);
    setEditHoTen("");
    setEditEmail("");
    setEditPassword("");
  }

  // ===============================
  // CẬP NHẬT
  // ===============================

  async function updateAccount() {
    if (!editingAccount) return;

    if (!editHoTen.trim() || !editEmail.trim()) {
      alert("Vui lòng nhập đầy đủ họ tên và email.");
      return;
    }

    setSavingEdit(true);

    try {
      const response = await authFetch(
        `/api/admin/accounts/${editingAccount.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ho_ten: editHoTen.trim(),
            email: editEmail.trim(),
            password: editPassword.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(
          result.error || "Không thể cập nhật tài khoản."
        );
        return;
      }

      alert("Cập nhật tài khoản thành công.");

      closeEditModal();
      await loadAccounts();
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ===============================
  // XÓA BCH
  // ===============================

  async function deleteAccount(account: any) {
    if (!account.roles?.includes("bch_hsv")) {
      alert("Chỉ được xóa tài khoản BCH.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${account.ho_ten}" không?\n\nTài khoản đăng nhập cũng sẽ bị xóa.`
    );

    if (!confirmed) return;

    try {
      const response = await authFetch(
        `/api/admin/accounts/${account.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(
          result.error || "Không thể xóa tài khoản."
        );
        return;
      }

      alert("Đã xóa tài khoản BCH.");

      await loadAccounts();
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi.");
    }
  }

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  // ===============================
  // GIAO DIỆN
  // ===============================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      {/* HEADER */}

      <Header
        tab=""
        setTab={() => {}}
        openCriteria={() => {}}
        openProfile={() => {}}
      />

      {/* BODY */}

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          minHeight: "calc(100vh - 90px)",
        }}
      >
        {/* SIDEBAR */}

        <SidebarChutichhsv />

        {/* CONTENT */}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "35px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            {/* PAGE HEADER */}

            <div
              style={{
                background:
                  "linear-gradient(135deg, #1d4ed8, #2563eb)",
                borderRadius: "20px",
                padding: "20px 24px",
                color: "#fff",
                marginBottom: "25px",
                boxShadow:
                  "0 8px 25px rgba(37, 99, 235, 0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.85,
                      marginBottom: "8px",
                      fontWeight: 500,
                      letterSpacing: "0.3px",
                    }}
                  >
                    HỆ THỐNG QUẢN LÝ HỒ SƠ SINH VIÊN 5 TỐT
                  </div>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 700,
                    }}
                  >
                    Quản lý Ban Chấp hành
                  </h1>
                </div>

                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "18px",
                    background:
                      "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    border:
                      "1px solid rgba(255,255,255,0.2)",
                    flexShrink: 0,
                  }}
                >
                  👥
                </div>
              </div>
            </div>

            {/* TRANG CHỦ */}

            <button
              type="button"
              onClick={() =>
                router.push("/chutichhsv")
              }
              style={{
                marginBottom: "25px",
                padding: "10px 16px",
                border: "1px solid #dbe2ea",
                borderRadius: "10px",
                background: "#fff",
                color: "#334155",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .2s ease",
                boxShadow:
                  "0 2px 6px rgba(15,23,42,.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "#eff6ff";
                e.currentTarget.style.color =
                  "#2563eb";
                e.currentTarget.style.transform =
                  "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "#fff";
                e.currentTarget.style.color =
                  "#334155";
                e.currentTarget.style.transform =
                  "translateX(0)";
              }}
            >
              🏠 Trang chủ
            </button>

            {/* FORM TẠO TÀI KHOẢN */}

            <section
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "28px",
                marginBottom: "25px",
                border: "1px solid #e2e8f0",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "25px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "12px",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  ➕
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "19px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Tạo tài khoản mới
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Thêm tài khoản quyền Chủ tịch hoặc quyền BCH.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "18px",
                }}
              >
                {/* HỌ TÊN */}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#334155",
                    }}
                  >
                    Họ tên
                  </label>

                  <input
                    value={hoTen}
                    onChange={(e) =>
                      setHoTen(e.target.value)
                    }
                    placeholder="Nhập họ tên"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius: "10px",
                      outline: "none",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#334155",
                    }}
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Nhập email @clbsv5tbmu.com"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius: "10px",
                      outline: "none",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#334155",
                    }}
                  >
                    Mật khẩu
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Nhập mật khẩu"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius: "10px",
                      outline: "none",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* VAI TRÒ */}

              <div
                style={{
                  marginTop: "22px",
                  padding: "18px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#334155",
                    marginBottom: "13px",
                  }}
                >
                  Vai trò
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "25px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={chuTich}
                      onChange={(e) =>
                        setChuTich(
                          e.target.checked
                        )
                      }
                    />

                    Chủ tịch Hội Sinh viên Trường
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bch}
                      onChange={(e) =>
                        setBch(
                          e.target.checked
                        )
                      }
                    />

                    BCH Hội Sinh viên Trường
                  </label>
                </div>
              </div>

              {/* BUTTON */}

              <button
                type="button"
                onClick={createAccount}
                disabled={creating}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "13px",
                  border: "none",
                  borderRadius: "10px",
                  background: creating
                    ? "#94a3b8"
                    : "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: creating
                    ? "not-allowed"
                    : "pointer",
                  transition: "all .2s ease",
                }}
              >
                {creating
                  ? "Đang tạo tài khoản..."
                  : "Tạo tài khoản"}
              </button>
            </section>

            {/* DANH SÁCH */}

            <section
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "28px",
                border: "1px solid #e2e8f0",
                boxShadow:
                  "0 2px 10px rgba(15,23,42,.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "22px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    👥
                  </div>

                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "19px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      Danh sách tài khoản
                    </h2>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      {accounts.length} tài khoản
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadAccounts}
                  disabled={loadingAccounts}
                  style={{
                    padding: "9px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "9px",
                    background: "#fff",
                    color: "#334155",
                    cursor: loadingAccounts
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {loadingAccounts
                    ? "Đang tải..."
                    : "↻ Làm mới"}
                </button>
              </div>

              {loadingAccounts ? (
                <div
                  style={{
                    padding: "50px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner />
                </div>
              ) : accounts.length === 0 ? (
                <div
                  style={{
                    padding: "45px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Chưa có tài khoản nào.
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "800px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#dbeafe",
                        }}
                      >
                        <th
                          style={{
                            padding: "14px",
                            textAlign: "center",
                          }}
                        >
                          STT
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                          }}
                        >
                          Họ tên
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                          }}
                        >
                          Email
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "left",
                          }}
                        >
                          Vai trò
                        </th>

                        <th
                          style={{
                            padding: "14px",
                            textAlign: "center",
                          }}
                        >
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {accounts.map(
                        (account, index) => (
                          <tr
                            key={account.id}
                            style={{
                              borderTop:
                                "1px solid #e2e8f0",
                            }}
                          >
                            <td
                              style={{
                                padding: "14px",
                                textAlign: "center",
                                color: "#64748b",
                              }}
                            >
                              {index + 1}
                            </td>

                            <td
                              style={{
                                padding: "14px",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {account.ho_ten || "—"}
                            </td>

                            <td
                              style={{
                                padding: "14px",
                                color: "#475569",
                              }}
                            >
                              {account.email || "—"}
                            </td>

                            <td
                              style={{
                                padding: "14px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "6px",
                                }}
                              >
                                {(account.roles || []).map(
                                  (role: string) => (
                                    <span
                                      key={role}
                                      style={{
                                        padding:
                                          "5px 10px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          role ===
                                          "chu_tich_hsv"
                                            ? "#dbeafe"
                                            : "#fef3c7",
                                        color:
                                          role ===
                                          "chu_tich_hsv"
                                            ? "#1d4ed8"
                                            : "#92400e",
                                        fontSize:
                                          "13px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {role ===
                                      "chu_tich_hsv"
                                        ? "Chủ tịch"
                                        : role ===
                                          "bch_hsv"
                                        ? "BCH"
                                        : role}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>

                            <td
                              style={{
                                padding: "14px",
                                textAlign: "center",
                              }}
                            >
                              {account.roles?.includes(
                                "bch_hsv"
                              ) ? (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      "center",
                                    gap: "8px",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        account
                                      )
                                    }
                                    style={{
                                      padding:
                                        "7px 12px",
                                      border:
                                        "1px solid #2563eb",
                                      borderRadius:
                                        "8px",
                                      background:
                                        "#fff",
                                      color:
                                        "#2563eb",
                                      fontWeight: 600,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    ✎ Sửa
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteAccount(
                                        account
                                      )
                                    }
                                    style={{
                                      padding:
                                        "7px 12px",
                                      border: "none",
                                      borderRadius:
                                        "8px",
                                      background:
                                        "#fee2e2",
                                      color:
                                        "#b91c1c",
                                      fontWeight: 600,
                                      cursor:
                                        "pointer",
                                    }}
                                  >
                                    🗑 Xóa
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "#94a3b8",
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODAL SỬA */}

      {editingAccount && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#fff",
              padding: "28px",
              borderRadius: "18px",
              boxShadow:
                "0 15px 45px rgba(0,0,0,.2)",
              boxSizing: "border-box",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Sửa tài khoản BCH
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Cập nhật thông tin tài khoản
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  fontSize: "22px",
                  color: "#64748b",
                  cursor: savingEdit
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                ×
              </button>
            </div>

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Họ tên
            </label>

            <input
              value={editHoTen}
              onChange={(e) =>
                setEditHoTen(e.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "18px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
              }}
            />

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={editEmail}
              onChange={(e) =>
                setEditEmail(e.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "18px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
              }}
            />

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Mật khẩu mới
            </label>

            <input
              type="password"
              value={editPassword}
              onChange={(e) =>
                setEditPassword(
                  e.target.value
                )
              }
              placeholder="Để trống nếu không muốn đổi"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "25px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                style={{
                  padding: "11px 18px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "9px",
                  background: "#fff",
                  color: "#334155",
                  fontWeight: 600,
                  cursor: savingEdit
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={updateAccount}
                disabled={savingEdit}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  borderRadius: "9px",
                  background: savingEdit
                    ? "#94a3b8"
                    : "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: savingEdit
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {savingEdit
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

