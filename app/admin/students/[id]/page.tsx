"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function StudentsDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [nhanXet, setNhanXet] = useState("");
  const [daoDucFiles, setDaoDucFiles] = useState<any[]>([]);
  const [hocTapFiles, setHocTapFiles] = useState<any[]>([]);
  const [theLucFiles, setTheLucFiles] = useState<any[]>([]);
  const [tinhNguyenFiles, setTinhNguyenFiles] = useState<any[]>([]);
  const [hoiNhapFiles, setHoiNhapFiles] = useState<any[]>([]);
  const [uuTienFiles, setUuTienFiles] = useState<any[]>([]);
  const [baoCaoFiles, setBaoCaoFiles] = useState<any[]>([]);
  const [trangThai, setTrangThai] = useState("");

  useEffect(() => {
    if (!id) return;

    loadStudent();
    loadFiles();
  }, [id]);

  async function loadStudent() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setProfile(data);
    setTrangThai(data.trang_thai || "cho-duyet");
    setNhanXet(data.nhan_xet || "");
  }

  async function loadFiles() {
    const folders = [
      {
  path: "bao-cao",
  setter: setBaoCaoFiles,
      },
      {
        path: "dao-duc",
        setter: setDaoDucFiles,
      },
      {
        path: "hoc-tap",
        setter: setHocTapFiles,
      },
      {
        path: "the-luc",
        setter: setTheLucFiles,
      },
      {
        path: "tinh-nguyen",
        setter: setTinhNguyenFiles,
      },
      {
        path: "hoi-nhap",
        setter: setHoiNhapFiles,
      },
      {
        path: "uu-tien",
        setter: setUuTienFiles,
      },
    ];

    for (const folder of folders) {
      const { data } = await supabase.storage
        .from("Ho so SV5T")
        .list(`${id}/${folder.path}`);

      folder.setter(
        (data || []).sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          )
        )
      );
    }
  }

  function renderFiles(
    files: any[],
    folder: string
  ) {
    if (files.length === 0) {
      return (
        <div
          style={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          Chưa có minh chứng
        </div>
      );
    }

    return files.map((file) => {
      const url =
        process.env
          .NEXT_PUBLIC_SUPABASE_URL +
        `/storage/v1/object/public/Ho%20so%20SV5T/${id}/${folder}/${file.name}`;
const baoCao =
  baoCaoFiles.length > 0
    ? baoCaoFiles[0]
    : null;

const baoCaoUrl = baoCao
  ? process.env
      .NEXT_PUBLIC_SUPABASE_URL +
    `/storage/v1/object/public/Ho%20so%20SV5T/${id}/bao-cao/${baoCao.name}`
  : "";
      return (
        <div
          key={file.name}
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              marginBottom: "10px",
              wordBreak: "break-word",
            }}
          >
            📄{" "}
            {file.name.replace(
              /^\d+-/,
              ""
            )}
          </div>

          <div
  style={{
    display: "flex",
    gap: "80px",
    alignItems: "flex-start",
    marginTop: "-30px",
  }}
>
            <a
              href={url}
              target="_blank"
              style={{
                background: "#2563eb",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              👁 Xem
            </a>

            <a
              href={url}
              download
              style={{
                background: "#16a34a",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "13px",
              }}
            >
              ⬇ Tải
            </a>
          </div>
        </div>
      );
    });
  }

  const baoCao =
  baoCaoFiles.length > 0
    ? baoCaoFiles[0]
    : null;

const baoCaoUrl = baoCao
  ? process.env.NEXT_PUBLIC_SUPABASE_URL +
    `/storage/v1/object/public/Ho%20so%20SV5T/${id}/bao-cao/${baoCao.name}`
  : "";
  if (!profile) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        Đang tải...
      </div>
    );
  }
return (
  <div
    style={{
      padding: "30px",
      maxWidth: "1800px",
      margin: "0 auto",
    }}
  >
    <h1
      style={{
        fontSize: "34px",
        marginBottom: "25px",
      }}
    >
      🏆 Hồ sơ Sinh viên 5 Tốt cấp Trường
    </h1>

    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "25px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <a
        href="/admin"
        style={{
          display: "inline-block",
          marginBottom: "25px",
          padding: "10px 16px",
          background: "#ffffff",
          color: "#0f172a",
          textDecoration: "none",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          fontWeight: "600",
        }}
      >
        ← Trang chính
      </a>

      <h2
  style={{
    marginTop: "-10px",
    marginBottom: "20px",
  }}
>
        👤 Thông tin cá nhân
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 250px 500px",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* Cột 1 */}
        <div>
          <div style={{ marginBottom: "20px" }}>
            <b>Họ tên:</b> {profile.ho_ten}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <b>Lớp:</b> {profile.lop}
          </div>

          <div style={{ marginTop: "40px" }}>
            <b>Báo cáo:</b>

            {baoCao ? (
              <>
                <a
                  href={baoCaoUrl}
                  target="_blank"
                  style={{
                    marginLeft: "10px",
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  👁 Xem
                </a>

                <a
                  href={baoCaoUrl}
                  download
                  style={{
                    marginLeft: "10px",
                    color: "#16a34a",
                    textDecoration: "none",
                  }}
                >
                  ⬇ Tải
                </a>
              </>
            ) : (
              <span
                style={{
                  color: "#94a3b8",
                  marginLeft: "10px",
                }}
              >
                Chưa có báo cáo
              </span>
            )}
          </div>
        </div>

        {/* Cột 2 */}
        <div>
          <div style={{ marginBottom: "20px" }}>
            <b>MSSV:</b> {profile.mssv}
          </div>

          <div>
            <b>Email:</b> {profile.email}
          </div>
        </div>

        {/* Cột 3 */}
        <div>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: "16px",
      fontWeight: "600",
    }}
  >
    📝 Nhận xét của hồ sơ
  </h3>

  <button
    onClick={async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
  nhan_xet: nhanXet,
  trang_thai: trangThai,
  ngay_nhan_xet: new Date().toISOString(),
})
        .eq("id", id);

      if (error) {
        alert("Lưu thất bại");
        return;
      }

      alert("Đã lưu nhận xét");
    }}
    style={{
      padding: "8px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#5b92ff",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    💾 Lưu nhận xét
  </button>
</div>

<div style={{ marginBottom: "12px" }}>
  <label>
    <b>Trạng thái hồ sơ:</b>
  </label>

  <select
    value={trangThai}
    onChange={(e) => setTrangThai(e.target.value)}
    style={{
      marginLeft: "10px",
      padding: "8px",
      borderRadius: "8px",
    }}
  >
    <option value="cho-duyet">
      Hoàn thiện
    </option>

    <option value="can_bo_sung">
      Cần bổ sung
    </option>
  </select>
</div>
         <div
  style={{
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "20px",
    height: "140px",
    overflowY: "auto",
    lineHeight: "1.6",
    color: "#334155",
    fontSize: "16px",
  }}
>
            <textarea
  value={nhanXet}
  onChange={(e) => setNhanXet(e.target.value)}
  style={{
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    fontSize: "16px",
  }}
/>
          </div>
        </div>
      </div>
    </div>

    <div
      style={{
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f1f5f9",
              }}
            >
              <th
                style={{
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                ❤️ Đạo đức tốt
              </th>

              <th
                style={{
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                📚 Học tập tốt
              </th>

              <th
                style={{
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                💪 Thể lực tốt
              </th>

              <th
                style={{
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                🤝 Tình nguyện tốt
              </th>

              <th
                style={{
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                🌍 Hội nhập tốt
              </th>

              <th
                style={{
                  padding: "15px",
                }}
              >
                ⭐ Ưu tiên
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  daoDucFiles,
                  "dao-duc"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  hocTapFiles,
                  "hoc-tap"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  theLucFiles,
                  "the-luc"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  tinhNguyenFiles,
                  "tinh-nguyen"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  hoiNhapFiles,
                  "hoi-nhap"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                }}
              >
                {renderFiles(
                  uuTienFiles,
                  "uu-tien"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}