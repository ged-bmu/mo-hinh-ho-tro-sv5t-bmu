"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { registerFCMToken } from "@/lib/firebase-messaging";;
import Spinner from "@/app/components/Spinner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import {
  UserRound,
  Bell,
  BookOpen,
  Save,
  Loader2,
  ArrowLeft,
  LockKeyhole,
  ChevronDown,
} from "lucide-react";

export default function CaiDatPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [tab, setTab] = useState("proof");
  const [showCriteria, setShowCriteria] = useState(false);

  const [userId, setUserId] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const [mssv, setMssv] = useState("");
  const [email, setEmail] = useState("");

  const [editHoTen, setEditHoTen] = useState("");
  const [editLop, setEditLop] = useState("");
  const [editGioiTinh, setEditGioiTinh] = useState("");
  const [editNamSinh, setEditNamSinh] = useState("");
  const [editDanToc, setEditDanToc] = useState("");
  const [editChucVuDoanHoi, setEditChucVuDoanHoi] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Bạn chưa đăng nhập.");
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Lỗi tải hồ sơ:", error);
        alert("Không thể tải thông tin cá nhân.");
        return;
      }

      setMssv(profile?.mssv || "");
      setEditHoTen(profile?.ho_ten || "");
      setEditLop(profile?.lop || "");
      setEditGioiTinh(profile?.gioi_tinh || "");
      setEditNamSinh(
        profile?.nam_sinh ? String(profile.nam_sinh) : ""
      );
      setEditDanToc(profile?.dan_toc || "");
      setEditChucVuDoanHoi(profile?.chuc_vu_doan_hoi || "");

      await checkNotificationStatus(user.id);
    } catch (error) {
      console.error("Lỗi tải cài đặt:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkNotificationStatus(id: string) {
    const { data, error } = await supabase
      .from("notification_tokens")
      .select("id")
      .eq("user_id", id)
      .limit(1);

    if (error) {
      console.error("Lỗi kiểm tra thông báo:", error);
      return;
    }

    setNotificationEnabled(Array.isArray(data) && data.length > 0);
  }

  async function savePersonalInfo() {
    if (saving) return;

    if (!editHoTen.trim() || !editLop.trim()) {
      alert("Vui lòng nhập đầy đủ họ tên và lớp.");
      return;
    }

    if (
      editNamSinh &&
      (!/^\d{4}$/.test(editNamSinh) ||
        Number(editNamSinh) < 1900 ||
        Number(editNamSinh) > new Date().getFullYear())
    ) {
      alert("Năm sinh không hợp lệ.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ho_ten: editHoTen.trim(),
          lop: editLop.trim(),
          gioi_tinh: editGioiTinh || null,
          nam_sinh: editNamSinh ? Number(editNamSinh) : null,
          dan_toc: editDanToc.trim() || null,
          chuc_vu_doan_hoi: editChucVuDoanHoi.trim() || null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        alert("Không thể cập nhật thông tin.");
        return;
      }

      alert("Đã cập nhật thông tin cá nhân!");
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotification() {
  if (notificationLoading) return;

  setNotificationLoading(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Bạn chưa đăng nhập.");
      return;
    }

    // ĐANG BẬT → TẮT
    if (notificationEnabled) {
  const { error } = await supabase
    .from("notification_tokens")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Lỗi xóa token:", error);
    alert("Không thể tắt thông báo.");
    return;
  }

  setNotificationEnabled(false);
  alert("Đã tắt thông báo.");
  return;
}

    // ĐANG TẮT → BẬT
    const token = await registerFCMToken();

    if (!token) {
      setNotificationEnabled(false);
      alert("Không thể bật thông báo.");
      return;
    }

    setNotificationEnabled(true);
    alert("Đã bật thông báo!");

  } catch (error) {
    console.error("Lỗi bật/tắt thông báo:", error);

    alert(
      `Lỗi: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    setNotificationLoading(false);
  }
}

  async function handleChangePassword() {
    if (passwordSaving) return;

    if (password.length < 6) {
      alert("Mật khẩu phải từ 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Đổi mật khẩu thành công!");

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      alert("Không thể đổi mật khẩu.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function toggleSection(section: string) {
    setActiveSection((current) =>
      current === section ? null : section
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    color: "#111827",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 7,
    fontWeight: 600,
    fontSize: 14,
    color: "#374151",
  };

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: "0 3px 12px rgba(0,0,0,0.035)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  };

  const menuButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "18px 16px",
    border: "none",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
    color: "#111827",
  };

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
        openProfile={() => {}}
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
            background: "#f1f5f9",
            padding: "24px 16px",
            color: "#111827",
          }}
        >
          {loading ? (
            <div
              style={{
                minHeight: "60vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Spinner size={40} />
            </div>
          ) : (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Link
            href="/"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#374151",
              textDecoration: "none",
              border: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                color: "#1e3a8a",
              }}
            >
              Cài đặt
            </h1>
          </div>
        </div>

        {/* MENU 1 - THÔNG TIN CÁ NHÂN */}
        <section style={sectionStyle}>
          <button
            onClick={() => toggleSection("profile")}
            style={menuButtonStyle}
          >
            <UserRound color="#2563eb" size={24} />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Thông tin cá nhân
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Chỉnh sửa thông tin hồ sơ
              </div>
            </div>

            <ChevronDown
              size={20}
              color="#64748b"
              style={{
                transform:
                  activeSection === "profile"
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </button>

          {activeSection === "profile" && (
            <div style={{ padding: "0 16px 20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 18,
                }}
              >
                <div>
                  <label style={labelStyle}>Họ và tên *</label>
                  <input
                    style={inputStyle}
                    value={editHoTen}
                    onChange={(e) => setEditHoTen(e.target.value)}
                    placeholder="Nhập họ tên"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Lớp *</label>
                  <input
                    style={inputStyle}
                    value={editLop}
                    onChange={(e) => setEditLop(e.target.value)}
                    placeholder="Nhập lớp"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Mã số sinh viên</label>
                  <input
                    style={{
                      ...inputStyle,
                      background: "#f3f4f6",
                      color: "#6b7280",
                    }}
                    value={mssv}
                    disabled
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    style={{
                      ...inputStyle,
                      background: "#f3f4f6",
                      color: "#6b7280",
                    }}
                    value={email}
                    disabled
                  />
                </div>

                <div>
                  <label style={labelStyle}>Giới tính</label>
                  <select
                    style={inputStyle}
                    value={editGioiTinh}
                    onChange={(e) => setEditGioiTinh(e.target.value)}
                  >
                    <option value="">Chưa chọn</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Năm sinh</label>
                  <input
                    style={inputStyle}
                    value={editNamSinh}
                    onChange={(e) => setEditNamSinh(e.target.value)}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Ví dụ: 2005"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Dân tộc</label>
                  <input
                    style={inputStyle}
                    value={editDanToc}
                    onChange={(e) => setEditDanToc(e.target.value)}
                    placeholder="Nhập dân tộc"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Chức vụ Đoàn - Hội</label>
                  <input
                    style={inputStyle}
                    value={editChucVuDoanHoi}
                    onChange={(e) =>
                      setEditChucVuDoanHoi(e.target.value)
                    }
                    placeholder="Nhập chức vụ (nếu có)"
                  />
                </div>
              </div>

              <button
                onClick={savePersonalInfo}
                disabled={saving}
                style={{
                  marginTop: 22,
                  width: "100%",
                  padding: 14,
                  border: "none",
                  borderRadius: 12,
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}

                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          )}
        </section>

        {/* MENU 2 - THÔNG BÁO */}
        <section style={sectionStyle}>
          <button
            onClick={() => toggleSection("notification")}
            style={menuButtonStyle}
          >
            <Bell color="#2563eb" size={24} />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Thông báo
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                {notificationEnabled
                  ? "Thông báo đang bật"
                  : "Thông báo đang tắt"}
              </div>
            </div>

            <ChevronDown
              size={20}
              color="#64748b"
              style={{
                transform:
                  activeSection === "notification"
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </button>

          {activeSection === "notification" && (
            <div style={{ padding: "0 16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: 16,
                  borderRadius: 14,
                  background: notificationEnabled
                    ? "#f0fdf4"
                    : "#fffbeb",
                  border: `1px solid ${
                    notificationEnabled ? "#bbf7d0" : "#fde68a"
                  }`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 6,
                    }}
                  >
                    {notificationEnabled
                      ? "Thông báo đang bật"
                      : "Thông báo đang tắt"}
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      margin: 0,
                      color: "#64748b",
                    }}
                  >
                    {notificationEnabled
                      ? "Bạn sẽ nhận thông báo về hoạt động mới và những cập nhật quan trọng."
                      : "Bật thông báo để nhận thông tin hoạt động và các cập nhật từ hệ thống SV5T BMU."}
                  </p>
                </div>

                <button
                  onClick={handleToggleNotification}
                  disabled={notificationLoading}
                  aria-label="Bật hoặc tắt thông báo"
                  style={{
                    width: 58,
                    height: 32,
                    borderRadius: 20,
                    border: "none",
                    background: notificationEnabled
                      ? "#16a34a"
                      : "#d1d5db",
                    position: "relative",
                    cursor: notificationLoading ? "wait" : "pointer",
                    flexShrink: 0,
                    opacity: notificationLoading ? 0.6 : 1,
                    transition: "0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#fff",
                      top: 4,
                      left: notificationEnabled ? 30 : 4,
                      transition: "0.2s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>

              {notificationLoading && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 14,
                    color: "#2563eb",
                    fontSize: 14,
                  }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý thông báo...
                </div>
              )}
            </div>
          )}
        </section>

        {/* MENU 3 - ĐỔI MẬT KHẨU */}
        <section style={sectionStyle}>
          <button
            onClick={() => toggleSection("password")}
            style={menuButtonStyle}
          >
            <LockKeyhole color="#2563eb" size={24} />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Đổi mật khẩu
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Thay đổi mật khẩu tài khoản
              </div>
            </div>

            <ChevronDown
              size={20}
              color="#64748b"
              style={{
                transform:
                  activeSection === "password"
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </button>

          {activeSection === "password" && (
            <div style={{ padding: "0 16px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Mật khẩu mới</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  style={inputStyle}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "none",
                  borderRadius: 12,
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: passwordSaving ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: passwordSaving ? 0.7 : 1,
                }}
              >
                {passwordSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LockKeyhole size={18} />
                )}

                {passwordSaving
                  ? "Đang đổi mật khẩu..."
                  : "Lưu mật khẩu mới"}
              </button>
            </div>
          )}
        </section>

        {/* MENU 4 - HƯỚNG DẪN */}
        <section style={sectionStyle}>
          <button
            onClick={() => toggleSection("guide")}
            style={menuButtonStyle}
          >
            <BookOpen color="#2563eb" size={24} />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Hướng dẫn sử dụng
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Hướng dẫn các chức năng hệ thống
              </div>
            </div>

            <ChevronDown
              size={20}
              color="#64748b"
              style={{
                transform:
                  activeSection === "guide"
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </button>

          {activeSection === "guide" && (
            <div style={{ padding: "0 16px 20px" }}>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#64748b",
                  marginTop: 0,
                  marginBottom: 18,
                }}
              >
                Xem hướng dẫn sử dụng hệ thống, tải minh chứng,
                nộp hồ sơ và các chức năng khác.
              </p>

              <Link
                href="/huong-dan"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                <BookOpen size={18} />
                Xem hướng dẫn
              </Link>
            </div>
          )}
        </section>
      </div>
          )}
        </main>
      </div>

      <Footer />
      {showCriteria && (
        <CriteriaModal onClose={() => setShowCriteria(false)} />
      )}
    </div>
  );
}