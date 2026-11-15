
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CriteriaModal from "../../components/CriteriaModal";

const CRITERIA = [
  { id: "dao-duc", name: "Đạo đức tốt", icon: "🌱", color: "#16a34a", bg: "#dcfce7" },
  { id: "hoc-tap", name: "Học tập tốt", icon: "📚", color: "#2563eb", bg: "#dbeafe" },
  { id: "the-luc", name: "Thể lực tốt", icon: "💪", color: "#ea580c", bg: "#ffedd5" },
  { id: "tinh-nguyen", name: "Tình nguyện tốt", icon: "❤️", color: "#e11d48", bg: "#ffe4e6" },
  { id: "hoi-nhap", name: "Hội nhập tốt", icon: "🌏", color: "#0891b2", bg: "#cffafe" },
  { id: "uu-tien", name: "Ưu tiên", icon: "⭐", color: "#9333ea", bg: "#f3e8ff" },
];

type AcademicYear = {
  id: number;
  name: string;
  is_current: boolean;
};

type CriterionItem = {
  id: number;
  academic_year_id: number;
  criterion: string;
  content: string;
  sort_order: number;
  item_type: "required" | "additional";
};

export default function TaoTieuChiPage() {
  const [tab, setTab] = useState("");
  const [showCriteria, setShowCriteria] = useState(false);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [criterion, setCriterion] = useState("dao-duc");

  const [items, setItems] = useState<CriterionItem[]>([]);
  const [newContent, setNewContent] = useState("");
  const [itemType, setItemType] = useState<"required" | "additional">("required");

const [additionalTitle, setAdditionalTitle] = useState(
  "Đạt thêm 1 trong các tiêu chí sau"
);

const [editingAdditionalTitle, setEditingAdditionalTitle] = useState(false);
const [titleDraft, setTitleDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initialize() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/introduce";
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role, roles")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        const isAdmin =
          profile?.role === "admin" ||
          (Array.isArray(profile?.roles) &&
            profile.roles.includes("admin"));

        if (!isAdmin) {
          window.location.href = "/introduce";
          return;
        }

        const { data, error } = await supabase
          .from("academic_years")
          .select("id, name, is_current")
          .order("id", { ascending: false });

        if (error) throw error;

        const yearList = (data || []) as AcademicYear[];
        setYears(yearList);

        const current = yearList.find((y) => y.is_current);

        if (current) setYearId(String(current.id));
        else if (yearList.length) setYearId(String(yearList[0].id));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

async function loadItems() {
  if (!yearId) {
    setItems([]);
    return;
  }

  setLoadingItems(true);
  setError("");

  try {
    const [itemsResult, settingsResult] = await Promise.all([
      supabase
        .from("sv5t_criterion_items")
        .select("*")
        .eq("academic_year_id", Number(yearId))
        .eq("criterion", criterion)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),

      supabase
        .from("sv5t_criterion_settings")
        .select("additional_title")
        .eq("academic_year_id", Number(yearId))
        .eq("criterion", criterion)
        .maybeSingle(),
    ]);

    if (itemsResult.error) throw itemsResult.error;
    if (settingsResult.error) throw settingsResult.error;

    setItems((itemsResult.data || []) as CriterionItem[]);

    setAdditionalTitle(
      settingsResult.data?.additional_title ||
        "Đạt thêm 1 trong các tiêu chí sau"
    );
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Không thể tải nội dung."
    );
  } finally {
    setLoadingItems(false);
  }
}

  useEffect(() => {
    loadItems();
  }, [yearId, criterion]);

  async function handleAdd() {
    const content = newContent.trim();

    if (!content) {
      alert("Vui lòng nhập nội dung tiêu chuẩn.");
      return;
    }

    if (!yearId) {
      alert("Chưa có năm học.");
      return;
    }

    setSaving(true);

    try {
      const groupItems = items.filter(
  (item) => item.item_type === itemType
);

const { error } = await supabase
  .from("sv5t_criterion_items")
  .insert({
    academic_year_id: Number(yearId),
    criterion,
    content,
    item_type: itemType,
    sort_order: groupItems.length,
  });

      if (error) throw error;

      setNewContent("");
      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể thêm nội dung.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(item: CriterionItem) {
    const newValue = window.prompt(
      "Chỉnh sửa nội dung tiêu chuẩn:",
      item.content
    );

    if (newValue === null) return;

    const content = newValue.trim();

    if (!content) {
      alert("Nội dung không được để trống.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("sv5t_criterion_items")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể cập nhật.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CriterionItem) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nội dung:\n\n${item.content}`)) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("sv5t_criterion_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      await loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xóa nội dung.");
    } finally {
      setSaving(false);
    }
  }

async function handleMove(
  item: CriterionItem,
  direction: "up" | "down"
) {
  const groupItems = items.filter(
    (entry) => entry.item_type === item.item_type
  );

  const index = groupItems.findIndex((entry) => entry.id === item.id);
  const newIndex = direction === "up" ? index - 1 : index + 1;

  if (newIndex < 0 || newIndex >= groupItems.length) return;

  const first = groupItems[index];
  const second = groupItems[newIndex];

  setSaving(true);

  try {
    const { error: error1 } = await supabase
      .from("sv5t_criterion_items")
      .update({ sort_order: -999999 })
      .eq("id", first.id);

    if (error1) throw error1;

    const { error: error2 } = await supabase
      .from("sv5t_criterion_items")
      .update({ sort_order: first.sort_order })
      .eq("id", second.id);

    if (error2) throw error2;

    const { error: error3 } = await supabase
      .from("sv5t_criterion_items")
      .update({ sort_order: second.sort_order })
      .eq("id", first.id);

    if (error3) throw error3;

    await loadItems();
  } catch (err) {
    alert(err instanceof Error ? err.message : "Không thể sắp xếp.");
    await loadItems();
  } finally {
    setSaving(false);
  }
}
async function handleSaveAdditionalTitle() {
  const title = titleDraft.trim();

  if (!title) {
    alert("Vui lòng nhập tên nhóm.");
    return;
  }

  setSaving(true);

  try {
    const { error } = await supabase
      .from("sv5t_criterion_settings")
      .upsert(
        {
          academic_year_id: Number(yearId),
          criterion,
          additional_title: title,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "academic_year_id,criterion" }
      );

    if (error) throw error;

    setAdditionalTitle(title);
    setEditingAdditionalTitle(false);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Không thể lưu tên nhóm.");
  } finally {
    setSaving(false);
  }
}
  const currentCriterion = CRITERIA.find((item) => item.id === criterion);
  const currentYear = years.find((year) => String(year.id) === yearId);

const requiredItems = items.filter(
  (item) => item.item_type === "required"
);

const additionalItems = items.filter(
  (item) => item.item_type === "additional"
);

const totalItems = items.length;

  if (loading) {
    return (
      <>
        <Header
          tab={tab}
          setTab={setTab}
          openCriteria={() => setShowCriteria(true)}
          openProfile={() => {}}
        />
        <div className="sv5t-loading">
          <div className="sv5t-loader" />
          <p>Đang tải dữ liệu...</p>
        </div>
        {showCriteria && <CriteriaModal onClose={() => setShowCriteria(false)} />}
      <Footer />
      </>
    );
  }

  if (error && years.length === 0) {
    return (
      <>
        <Header
          tab={tab}
          setTab={setTab}
          openCriteria={() => setShowCriteria(true)}
          openProfile={() => {}}
        />
        <div className="sv5t-error">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h2>Không thể tải dữ liệu</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
        {showCriteria && <CriteriaModal onClose={() => setShowCriteria(false)} />}
      <Footer />
      </>
    );
  }

  return (
    <>
      <Header
          tab={tab}
          setTab={setTab}
          openCriteria={() => setShowCriteria(true)}
          openProfile={() => {}}
        />

      <main className="sv5t-admin-page">
        <div className="sv5t-container">

          {/* HERO */}
<section
  className="sv5t-hero"
  style={{
    minHeight: "180px",
    height: "180px",
    padding: "20px 28px",
    boxSizing: "border-box",
  }}
>
  <div className="sv5t-hero-content">
    <div className="sv5t-eyebrow">
      <span className="sv5t-eyebrow-dot" />
      QUẢN TRỊ HỆ THỐNG SV5T
    </div>

    <h1 style={{ fontSize: "28px", lineHeight: 1.3, fontWeight: 700 }}>
      Quản lý tiêu chuẩn
    </h1>

    <div
      className="sv5t-hero-bottom"
      style={{
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        marginTop: "12px",
      }}
    >
      <span style={{ fontSize: "19px", fontWeight: 600 }}>
        🎯 5 tiêu chí
      </span>
      <span style={{ fontSize: "19px", fontWeight: 600 }}>
        📋 {totalItems} nội dung đang xem
      </span>
    </div>
  </div>

  <div className="sv5t-hero-art">
    <div className="sv5t-art-circle circle-one" />
    <div className="sv5t-art-circle circle-two" />
    <div className="sv5t-art-card">
      <div className="sv5t-art-icon">🏆</div>
      <div className="sv5t-art-title">SINH VIÊN</div>
      <div className="sv5t-art-title">5 TỐT</div>
      <div className="sv5t-art-stars">✦ ✦ ✦ ✦ ✦</div>
    </div>
  </div>
</section>

          {/* NĂM HỌC */}
          <section className="sv5t-year-card">
            <div className="sv5t-year-icon">📅</div>

            <div className="sv5t-year-info">
              <span className="sv5t-overline">PHẠM VI QUẢN LÝ</span>
              <h2>Năm học áp dụng</h2>
              <p>Chọn năm học để quản lý bộ tiêu chuẩn tương ứng.</p>
            </div>

            <div className="sv5t-year-select-wrap">
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                disabled={saving}
                className="sv5t-year-select"
              >
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}{year.is_current ? " (Hiện tại)" : ""}
                  </option>
                ))}
              </select>

              {currentYear?.is_current && (
                <span className="sv5t-current-badge">
                  ● Năm học hiện tại
                </span>
              )}
            </div>
          </section>

          {!years.length && (
            <div className="sv5t-empty-year">
              Chưa có năm học. Vui lòng tạo năm học trước.
            </div>
          )}

          {/* TIÊU CHÍ */}
          <section className="sv5t-section">
            <div className="sv5t-section-heading">
              <div>
                <span className="sv5t-overline">PHÂN LOẠI NỘI DUNG</span>
                <h2>Các tiêu chí Sinh viên 5 tốt</h2>
                <p>Chọn một tiêu chí để quản lý các gạch đầu dòng.</p>
              </div>

              <div className="sv5t-section-count">
                <strong>05</strong>
                <span>TIÊU CHÍ</span>
              </div>
            </div>

            <div className="sv5t-criteria-grid">
              {CRITERIA.map((item, index) => {
                const active = criterion === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCriterion(item.id)}
                    disabled={saving}
                    className={`sv5t-criterion-card ${active ? "active" : ""}`}
                    style={{
                      "--item-color": item.color,
                      "--item-bg": item.bg,
                      animationDelay: `${index * 60}ms`,
                    } as CSSProperties}
                  >
                    <div className="sv5t-criterion-top">
                      <div className="sv5t-criterion-icon">
                        {item.icon}
                      </div>

                      <span className="sv5t-criterion-check">
                        {active ? "✓" : "↗"}
                      </span>
                    </div>

                    <div className="sv5t-criterion-name">{item.name}</div>

                    <div className="sv5t-criterion-caption">
                      {active ? "Đang quản lý" : "Xem nội dung"}
                    </div>

                    <div className="sv5t-criterion-line" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* QUẢN LÝ NỘI DUNG */}
          <section className="sv5t-content-section">
            <div className="sv5t-content-heading">
              <div className="sv5t-content-title">
                <div
                  className="sv5t-content-icon"
                  style={{
                    background: currentCriterion?.bg,
                    color: currentCriterion?.color,
                  }}
                >
                  {currentCriterion?.icon}
                </div>

                <div>
                  <span className="sv5t-overline">NỘI DUNG TIÊU CHUẨN</span>
                  <h2>{currentCriterion?.name}</h2>
                  <p>{currentYear?.name || "Chưa chọn năm học"}</p>
                </div>
              </div>

              <div className="sv5t-total-badge">
                <strong>{totalItems}</strong>
                <span>nội dung</span>
              </div>
            </div>

            {/* FORM THÊM */}
            <div className="sv5t-add-panel">
              <div className="sv5t-add-heading">
                <div className="sv5t-add-symbol">＋</div>
                <div>
                  <h3>Thêm nội dung tiêu chuẩn</h3>
                  <p>Nhập một gạch đầu dòng mới cho tiêu chí đang chọn.</p>
                </div>
              </div>
           <div className="sv5t-type-selector">
  <label className="sv5t-type-option">
    <input
      type="radio"
      name="itemType"
      checked={itemType === "required"}
      onChange={() => setItemType("required")}
      disabled={saving}
    />
    <span>🔴 Tiêu chuẩn bắt buộc</span>
  </label>

  <label className="sv5t-type-option additional">
    <input
      type="radio"
      name="itemType"
      checked={itemType === "additional"}
      onChange={() => setItemType("additional")}
      disabled={saving}
    />
    <span>⭐ Tiêu chuẩn đạt thêm</span>
  </label>
</div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Ví dụ: Có thành tích tốt trong học tập và nghiên cứu khoa học..."
                rows={3}
                disabled={saving || !yearId}
                className="sv5t-textarea"
              />

              <div className="sv5t-add-footer">
                <span>💡 Nội dung sẽ được hiển thị cho sinh viên khi chọn tiêu chí tương ứng.</span>

                <button
                  onClick={handleAdd}
                  disabled={saving || !yearId || !newContent.trim()}
                  className="sv5t-add-button"
                >
                  {saving ? (
                    <>
                      <span className="sv5t-button-spinner" />
                      Đang xử lý
                    </>
                  ) : (
                    <>＋ Thêm nội dung</>
                  )}
                </button>
              </div>
            </div>

            {/* DANH SÁCH */}


            {error && (
              <div className="sv5t-inline-error">⚠️ {error}</div>
            )}

            {loadingItems ? (
              <div className="sv5t-list-loading">
                <div className="sv5t-loader" />
                <span>Đang tải nội dung...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="sv5t-empty">
                <div className="sv5t-empty-icon">📂</div>
                <h3>Chưa có nội dung nào</h3>
                <p>
                  Tiêu chí này chưa được Ban Chủ nhiệm thiết lập.
                  Hãy thêm gạch đầu dòng đầu tiên ở phía trên.
                </p>
              </div>
            ) : (
              <div className="sv5t-items">
                <div className="sv5t-groups">
  {/* TIÊU CHUẨN BẮT BUỘC */}
  <div className="sv5t-list-heading">
    <div>
      <h3>🔴 Tiêu chuẩn bắt buộc</h3>
      <p>Các nội dung sinh viên phải đáp ứng</p>
    </div>
    <span className="sv5t-list-number">
      {requiredItems.length} nội dung
    </span>
  </div>

  <div className="sv5t-items">
    {requiredItems.map((item, index) => (
      <div key={item.id} className="sv5t-item">
        <div className="sv5t-item-number">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="sv5t-item-text">{item.content}</div>

        <div className="sv5t-item-actions">
          <button
            title="Di chuyển lên"
            disabled={saving || index === 0}
            onClick={() => handleMove(item, "up")}
            className="sv5t-action move"
          >
            ↑
          </button>

          <button
            title="Di chuyển xuống"
            disabled={saving || index === requiredItems.length - 1}
            onClick={() => handleMove(item, "down")}
            className="sv5t-action move"
          >
            ↓
          </button>

          <button
            title="Chỉnh sửa"
            disabled={saving}
            onClick={() => handleEdit(item)}
            className="sv5t-action edit"
          >
            ✎ <span>Sửa</span>
          </button>

          <button
            title="Xóa"
            disabled={saving}
            onClick={() => handleDelete(item)}
            className="sv5t-action delete"
          >
            <span>×</span> <span>Xóa</span>
          </button>
        </div>
      </div>
    ))}

    {requiredItems.length === 0 && (
      <p>Chưa có tiêu chuẩn bắt buộc.</p>
    )}
  </div>

  {/* TIÊU CHUẨN ĐẠT THÊM */}
  <div className="sv5t-list-heading">
    <div>
      <h3>⭐ Tiêu chuẩn đạt thêm</h3>
      <p>Các nội dung được lựa chọn để đáp ứng tiêu chí</p>
    </div>
    <span className="sv5t-list-number">
      {additionalItems.length} nội dung
    </span>
  </div>

  <div className="sv5t-items">
    {additionalItems.map((item, index) => (
      <div key={item.id} className="sv5t-item">
        <div className="sv5t-item-number">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="sv5t-item-text">{item.content}</div>

        <div className="sv5t-item-actions">
          <button
            title="Di chuyển lên"
            disabled={saving || index === 0}
            onClick={() => handleMove(item, "up")}
            className="sv5t-action move"
          >
            ↑
          </button>

          <button
            title="Di chuyển xuống"
            disabled={saving || index === additionalItems.length - 1}
            onClick={() => handleMove(item, "down")}
            className="sv5t-action move"
          >
            ↓
          </button>

          <button
            title="Chỉnh sửa"
            disabled={saving}
            onClick={() => handleEdit(item)}
            className="sv5t-action edit"
          >
            ✎ <span>Sửa</span>
          </button>

          <button
            title="Xóa"
            disabled={saving}
            onClick={() => handleDelete(item)}
            className="sv5t-action delete"
          >
            <span>×</span> <span>Xóa</span>
          </button>
        </div>
      </div>
    ))}

    {additionalItems.length === 0 && (
      <p>Chưa có tiêu chuẩn đạt thêm.</p>
    )}
  </div>
</div>
              </div>
            )}
          </section>
        </div>
      </main>

      {showCriteria && <CriteriaModal onClose={() => setShowCriteria(false)} />}
      <Footer />

      {/* CSS VÀ HIỆU ỨNG */}
      <style jsx global>{`
        .sv5t-admin-page {
          min-height: 100vh;
          background: #f4f7fc;
          color: #17243b;
          padding: 32px 18px 55px;
          font-family: inherit;
        }

        .sv5t-container {
          width: 100%;
          max-width: 1160px;
          margin: 0 auto;
        }

        .sv5t-hero {
          position: relative;
          min-height: 235px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 35px 48px;
          border-radius: 22px;
          color: white;
          background: linear-gradient(120deg, #123c83 0%, #1763c6 55%, #3689e9 100%);
          box-shadow: 0 12px 35px rgba(37, 99, 235, .19);
          animation: sv5tFadeUp .55s ease both;
        }

        .sv5t-hero-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
        }

        .sv5t-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 12px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 30px;
          background: rgba(255,255,255,.11);
          font-size: 10px;
          letter-spacing: 1.4px;
          font-weight: 800;
        }

        .sv5t-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6ee7b7;
          box-shadow: 0 0 10px #6ee7b7;
        }

        .sv5t-hero h1 {
          font-size: clamp(27px, 4vw, 38px);
          line-height: 1.2;
          font-weight: 800;
          margin: 17px 0 9px;
          color: white;
          letter-spacing: -.8px;
        }

        .sv5t-hero p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,.8);
        }

        .sv5t-hero-bottom {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 23px;
          font-size: 12px;
          color: rgba(255,255,255,.92);
        }

        .sv5t-hero-art {
          position: relative;
          width: 230px;
          height: 200px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
        }

        .sv5t-art-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.2);
        }

        .circle-one {
          width: 185px;
          height: 185px;
          animation: sv5tRotate 20s linear infinite;
        }

        .circle-two {
          width: 145px;
          height: 145px;
          border-style: dashed;
          animation: sv5tRotate 28s linear infinite reverse;
        }

        .sv5t-art-card {
          position: relative;
          z-index: 2;
          width: 120px;
          height: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 17px;
          background: rgba(255,255,255,.15);
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0,0,0,.12);
          transform: rotate(5deg);
        }

        .sv5t-art-icon { font-size: 36px; margin-bottom: 7px; }
        .sv5t-art-title { font-size: 15px; font-weight: 900; letter-spacing: 2px; }
        .sv5t-art-stars { font-size: 10px; margin-top: 7px; color: #fde68a; letter-spacing: 2px; }

        .sv5t-year-card {
          display: flex;
          align-items: center;
          gap: 17px;
          margin: 22px 0 34px;
          padding: 20px 23px;
          border: 1px solid #e6ebf3;
          border-radius: 16px;
          background: white;
          box-shadow: 0 4px 16px rgba(15,23,42,.035);
          animation: sv5tFadeUp .6s ease both;
        }

        .sv5t-year-icon {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #eff6ff;
          font-size: 25px;
        }

        .sv5t-year-info { flex: 1; }
        .sv5t-overline {
          display: block;
          color: #8b9ab0;
          font-size: 10px;
          letter-spacing: 1.3px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .sv5t-year-info h2 {
          font-size: 16px;
          margin: 0 0 4px;
          font-weight: 750;
        }

        .sv5t-year-info p {
          color: #8491a5;
          font-size: 12px;
          margin: 0;
        }

        .sv5t-year-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-end;
        }

        .sv5t-year-select {
          min-width: 220px;
          padding: 11px 35px 11px 13px;
          border: 1px solid #dce4f0;
          border-radius: 9px;
          outline: none;
          background: #f8faff;
          color: #253858;
          font-weight: 650;
          font-size: 13px;
          cursor: pointer;
        }

        .sv5t-year-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.1);
        }

        .sv5t-current-badge {
          color: #16a34a;
          font-size: 10px;
          font-weight: 700;
        }

        .sv5t-section { margin-bottom: 35px; }

        .sv5t-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 19px;
        }

        .sv5t-section-heading h2 {
          margin: 0 0 6px;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .sv5t-section-heading p {
          margin: 0;
          color: #8290a5;
          font-size: 13px;
        }

        .sv5t-section-count {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 14px;
          border: 1px solid #e4eaf3;
          border-radius: 10px;
          background: white;
          color: #8b9ab0;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .sv5t-section-count strong {
          color: #2563eb;
          font-size: 22px;
        }

        .sv5t-criteria-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 15px;
        }

        .sv5t-criterion-card {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-align: left;
          min-height: 145px;
          padding: 19px 20px;
          border: 1px solid #e7ecf3;
          border-radius: 15px;
          background: white;
          cursor: pointer;
          color: #25344b;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
          animation: sv5tFadeUp .45s ease both;
        }

        .sv5t-criterion-card:hover {
          transform: translateY(-5px);
          border-color: var(--item-color);
          box-shadow: 0 12px 25px rgba(15,23,42,.08);
        }

        .sv5t-criterion-card.active {
          border: 1.5px solid var(--item-color);
          background: linear-gradient(145deg, white 55%, var(--item-bg));
          box-shadow: 0 5px 18px color-mix(in srgb, var(--item-color) 12%, transparent);
        }

        .sv5t-criterion-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .sv5t-criterion-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--item-bg);
          font-size: 23px;
          transition: transform .25s ease;
        }

        .sv5t-criterion-card:hover .sv5t-criterion-icon {
          transform: rotate(-7deg) scale(1.08);
        }

        .sv5t-criterion-check {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: var(--item-bg);
          color: var(--item-color);
          font-size: 12px;
          font-weight: 900;
        }

        .sv5t-criterion-name {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .sv5t-criterion-caption {
          font-size: 11px;
          color: #9aa6b7;
        }

        .sv5t-criterion-line {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 3px;
          background: var(--item-color);
          transition: width .3s ease;
        }

        .sv5t-criterion-card.active .sv5t-criterion-line,
        .sv5t-criterion-card:hover .sv5t-criterion-line {
          width: 100%;
        }

        .sv5t-content-section {
          padding: 25px;
          border: 1px solid #e6ebf3;
          border-radius: 19px;
          background: white;
          box-shadow: 0 5px 20px rgba(15,23,42,.035);
          animation: sv5tFadeUp .55s ease both;
        }

        .sv5t-content-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-bottom: 21px;
          border-bottom: 1px solid #edf0f5;
        }

        .sv5t-content-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sv5t-content-icon {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          font-size: 27px;
        }

        .sv5t-content-title h2 {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 800;
        }

        .sv5t-content-title p {
          margin: 0;
          color: #8b99ac;
          font-size: 12px;
        }

        .sv5t-total-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
        }

        .sv5t-total-badge strong { font-size: 22px; }

        .sv5t-add-panel {
          margin-top: 22px;
          padding: 20px;
          border: 1px solid #dce9fc;
          border-radius: 14px;
          background: linear-gradient(135deg, #f8fbff, #f2f7ff);
        }

        .sv5t-add-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .sv5t-add-symbol {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #2563eb;
          color: white;
          font-size: 22px;
          box-shadow: 0 4px 10px rgba(37,99,235,.22);
        }

        .sv5t-add-heading h3 {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 800;
        }

        .sv5t-add-heading p {
          margin: 0;
          color: #8493a9;
          font-size: 11px;
        }

        .sv5t-textarea {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid #dce5f1;
          border-radius: 10px;
          background: white;
          color: #26354c;
          font: inherit;
          font-size: 13px;
          line-height: 1.65;
          resize: vertical;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }

        .sv5t-textarea:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59,130,246,.1);
        }

        .sv5t-textarea::placeholder { color: #a7b2c2; }

        .sv5t-add-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 13px;
        }

        .sv5t-add-footer > span {
          color: #8391a5;
          font-size: 11px;
          line-height: 1.5;
        }

        .sv5t-add-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 18px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(120deg, #2563eb, #3985ef);
          color: white;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37,99,235,.2);
          transition: transform .2s, box-shadow .2s;
        }

        .sv5t-add-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 7px 17px rgba(37,99,235,.28);
        }

        .sv5t-add-button:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sv5t-button-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: white;
          border-radius: 50%;
          animation: sv5tRotate .7s linear infinite;
        }

        .sv5t-list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 27px 0 14px;
        }

        .sv5t-list-heading h3 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 800;
        }

        .sv5t-list-heading p {
          margin: 0;
          color: #94a0b1;
          font-size: 11px;
        }

        .sv5t-list-number {
          padding: 7px 11px;
          border: 1px solid #e6ebf3;
          border-radius: 7px;
          color: #74839a;
          font-size: 10px;
          font-weight: 800;
        }

        .sv5t-items {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .sv5t-item {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 14px;
          border: 1px solid #edf0f5;
          border-radius: 11px;
          background: white;
          transition: border-color .2s, transform .2s, box-shadow .2s;
          animation: sv5tFadeUp .35s ease both;
        }

        .sv5t-item:hover {
          border-color: #c8dcfa;
          transform: translateX(3px);
          box-shadow: 0 4px 12px rgba(15,23,42,.035);
        }

        .sv5t-item-number {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 850;
        }

        .sv5t-item-text {
          flex: 1;
          min-width: 0;
          color: #34445c;
          font-size: 13px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .sv5t-item-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .sv5t-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 30px;
          height: 31px;
          padding: 0 8px;
          border: 1px solid #e5eaf1;
          border-radius: 7px;
          background: white;
          color: #60718a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s;
        }

        .sv5t-action:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .sv5t-action.move:hover:not(:disabled) {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
        }

        .sv5t-action.edit {
          color: #2563eb;
          border-color: #dbeafe;
          background: #f5f9ff;
        }

        .sv5t-action.edit:hover:not(:disabled) {
          background: #dbeafe;
        }

        .sv5t-action.delete {
          color: #dc2626;
          border-color: #fee2e2;
          background: #fff7f7;
        }

        .sv5t-action.delete:hover:not(:disabled) {
          background: #fee2e2;
        }

        .sv5t-action.delete > span:first-child {
          font-size: 19px;
          line-height: 1;
        }

        .sv5t-empty {
          padding: 43px 20px;
          text-align: center;
          border: 1px dashed #d8e1ed;
          border-radius: 13px;
          background: #fafcff;
        }

        .sv5t-empty-icon {
          display: grid;
          place-items: center;
          width: 65px;
          height: 65px;
          margin: 0 auto 13px;
          border-radius: 20px;
          background: #eff6ff;
          font-size: 29px;
        }

        .sv5t-empty h3 {
          margin: 0 0 7px;
          color: #42536c;
          font-size: 15px;
        }

        .sv5t-empty p {
          max-width: 390px;
          margin: 0 auto;
          color: #9aa6b6;
          font-size: 12px;
          line-height: 1.7;
        }

        .sv5t-content-footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 19px;
          padding-top: 14px;
          border-top: 1px solid #edf0f5;
          color: #a0aabc;
          font-size: 10px;
        }

        .sv5t-inline-error {
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
        }

        .sv5t-list-loading,
        .sv5t-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 220px;
          color: #8493a9;
          font-size: 13px;
        }

        .sv5t-loader {
          width: 32px;
          height: 32px;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: sv5tRotate .75s linear infinite;
        }

        .sv5t-error,
        .sv5t-empty-year {
          padding: 55px 20px;
          text-align: center;
          color: #64748b;
        }

        .sv5t-error button {
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          cursor: pointer;
        }

        @keyframes sv5tRotate {
          to { transform: rotate(360deg); }
        }

        @keyframes sv5tFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .sv5t-admin-page { padding: 18px 12px 35px; }

          .sv5t-hero {
            min-height: 190px;
            padding: 26px 23px;
            border-radius: 17px;
          }

          .sv5t-hero-art { width: 120px; transform: scale(.8); }
          .sv5t-hero p { font-size: 12px; }
          .sv5t-hero-bottom { gap: 10px; font-size: 10px; }

          .sv5t-year-card { padding: 15px; gap: 11px; flex-wrap: wrap; }
          .sv5t-year-icon { width: 43px; height: 43px; }
          .sv5t-year-info { min-width: 150px; }
          .sv5t-year-select-wrap { width: 100%; align-items: stretch; }
          .sv5t-year-select { width: 100%; box-sizing: border-box; }

          .sv5t-criteria-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
          .sv5t-criterion-card { min-height: 130px; padding: 14px; }
          .sv5t-criterion-name { font-size: 13px; }

          .sv5t-section-heading h2 { font-size: 18px; }
          .sv5t-content-section { padding: 16px; border-radius: 14px; }
          .sv5t-content-title h2 { font-size: 16px; }
          .sv5t-content-icon { width: 45px; height: 45px; font-size: 23px; }

          .sv5t-add-panel { padding: 14px; }
          .sv5t-add-footer { align-items: stretch; flex-direction: column; }
          .sv5t-add-button { width: 100%; }

          .sv5t-item { flex-wrap: wrap; gap: 9px; }
          .sv5t-item-text { flex-basis: calc(100% - 50px); }
          .sv5t-item-actions { width: 100%; justify-content: flex-end; }
          .sv5t-action { height: 33px; }
        }

        @media (max-width: 420px) {
          .sv5t-hero-art { display: none; }
          .sv5t-hero { padding: 25px 20px; }
          .sv5t-section-count { padding: 7px 9px; }
          .sv5t-section-count strong { font-size: 18px; }
          .sv5t-content-heading { align-items: flex-start; }
          .sv5t-total-badge { padding: 7px 9px; }
          .sv5t-total-badge strong { font-size: 18px; }
          .sv5t-action span:not(:first-child) { display: inline; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sv5t-admin-page *,
          .sv5t-admin-page *::before,
          .sv5t-admin-page *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </>
  );
}
