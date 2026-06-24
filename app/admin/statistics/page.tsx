"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function StatisticsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] =
    useState("");
  const [selectedStudents, setSelectedStudents] =
    useState<any[]>([]);    
    const [studentSearch, setStudentSearch] =
  useState("");

  useEffect(() => {
    loadData();
  }, []);
  const totalStudents = students.length;
  const [selectedType, setSelectedType] =
  useState("");
  const loadData = async () => {
    const { data } = await supabase
  .from("profiles")
  .select("*")
  .neq("role", "admin");

    setStudents(data || []);
  };
const stats = {
  daoDuc: students.filter(
    (sv) => !sv["dao-duc"]
  ).length,

  hocTap: students.filter(
    (sv) => !sv["hoc-tap"]
  ).length,

  theLuc: students.filter(
    (sv) => !sv["the-luc"]
  ).length,

  tinhNguyen: students.filter(
    (sv) => !sv["tinh-nguyen"]
  ).length,

  hoiNhap: students.filter(
    (sv) => !sv["hoi-nhap"]
  ).length,

  full: students.filter((sv) => {
    const count = [
      sv["dao-duc"],
      sv["hoc-tap"],
      sv["the-luc"],
      sv["tinh-nguyen"],
      sv["hoi-nhap"],
    ].filter(Boolean).length;

    return count === 5;
  }).length,

  near: students.filter((sv) => {
    const count = [
      sv["dao-duc"],
      sv["hoc-tap"],
      sv["the-luc"],
      sv["tinh-nguyen"],
      sv["hoi-nhap"],
    ].filter(Boolean).length;

    return count === 4;
  }).length,

  medium: students.filter((sv) => {
    const count = [
      sv["dao-duc"],
      sv["hoc-tap"],
      sv["the-luc"],
      sv["tinh-nguyen"],
      sv["hoi-nhap"],
    ].filter(Boolean).length;

    return count === 3;
  }).length,

  low: students.filter((sv) => {
    const count = [
      sv["dao-duc"],
      sv["hoc-tap"],
      sv["the-luc"],
      sv["tinh-nguyen"],
      sv["hoi-nhap"],
    ].filter(Boolean).length;

    return count <= 2;
  }).length,
};
  const showStudents = (
    title: string,
    list: any[]
  ) => {
    setSelectedTitle(title);
    setSelectedStudents(list);
  };

  const criteriaStats = [
    {
      label: "Đạo đức tốt",
      key: "dao-duc",
    },
    {
      label: "Học tập tốt",
      key: "hoc-tap",
    },
    {
      label: "Thể lực tốt",
      key: "the-luc",
    },
    {
      label: "Tình nguyện tốt",
      key: "tinh-nguyen",
    },
    {
      label: "Hội nhập tốt",
      key: "hoi-nhap",
    },
  ];

  const completionStats = {
    "Đạt 5/5 tiêu chí": students.filter((sv) => {
      const count =
        Number(!!sv["dao-duc"]) +
        Number(!!sv["hoc-tap"]) +
        Number(!!sv["the-luc"]) +
        Number(!!sv["tinh-nguyen"]) +
        Number(!!sv["hoi-nhap"]);

      return count === 5;
    }),

    "Đạt 4/5 tiêu chí": students.filter((sv) => {
      const count =
        Number(!!sv["dao-duc"]) +
        Number(!!sv["hoc-tap"]) +
        Number(!!sv["the-luc"]) +
        Number(!!sv["tinh-nguyen"]) +
        Number(!!sv["hoi-nhap"]);

      return count === 4;
    }),

    "Đạt 3/5 tiêu chí": students.filter((sv) => {
      const count =
        Number(!!sv["dao-duc"]) +
        Number(!!sv["hoc-tap"]) +
        Number(!!sv["the-luc"]) +
        Number(!!sv["tinh-nguyen"]) +
        Number(!!sv["hoi-nhap"]);

      return count === 3;
    }),

    "Đạt ≤2/5 tiêu chí": students.filter((sv) => {
      const count =
        Number(!!sv["dao-duc"]) +
        Number(!!sv["hoc-tap"]) +
        Number(!!sv["the-luc"]) +
        Number(!!sv["tinh-nguyen"]) +
        Number(!!sv["hoi-nhap"]);

      return count <= 2;
    }),
  };

 const sortedStudents = [...selectedStudents]
  .filter((sv) =>
    (
      (sv.ho_ten || "") +
      (sv.mssv || "") +
      (sv.lop || "")
    )
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  )
  .sort((a, b) => {
    const lopCompare = (a.lop || "").localeCompare(
      b.lop || "",
      undefined,
      { numeric: true }
    );

    if (lopCompare !== 0) {
      return lopCompare;
    }

    return (a.mssv || "").localeCompare(
      b.mssv || "",
      undefined,
      { numeric: true }
    );
  });
 return (
  <div
    style={{
      padding: "30px",
    }}
  >
    <Link
      href="/admin"
      style={{
        display: "inline-flex",
        gap: "24px",
        alignItems: "flex-start",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "10px 16px",
        borderRadius: "12px",
        textDecoration: "none",
        color: "#334155",
        fontWeight: 600,
        marginBottom: "20px",
      }}
    >
      ← Trang chủ
    </Link>

    <h1
      style={{
        fontSize: "26px",
        marginBottom: "30px",
      }}
    >
      📊 <b>Thống kê hồ sơ</b>
    </h1>
<div
  style={{
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  }}
></div>
<div
  style={{
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
  }}
>
  <div style={{ flex: 1 }}>
    <h2
      style={{
        marginBottom: "20px",
        fontSize: "18px",
      }}
    >
      🎯 <b>Thống kê theo tiêu chí</b>
    </h2>

    {/* card trái */}
  </div>

  <div style={{ flex: 1 }}>
    <h2
      style={{
        marginBottom: "20px",
        fontSize: "18px",
      }}
    >
      📈 <b>Thống kê theo mức độ hoàn thành</b>
    </h2>
  </div>
</div>

<div style={{ display: "flex", gap: "24px" }}>
<div
  style={{
    flex: 1,
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
  }}
>
  <thead>
    <tr>
      
      <th
  style={{
    width: "35%",
    textAlign: "left",
    paddingBottom: "12px",
  }}
>
  Tiêu chí
</th>

  <th
    style={{
      textAlign: "center",
    }}
  >
    Đạt
  </th>

  <th
    style={{
      textAlign: "center",
    }}
  >
    Chưa đạt
  </th>

  <th
    style={{
      textAlign: "center",
    }}
  >
    Tỷ lệ
  </th>
</tr>
  </thead>

  <tbody>
    {criteriaStats.map(
      (item) => {
        const passed =
          students.filter(
            (sv) =>
              sv[item.key]
          );

    const failed =
      students.filter(
        (sv) =>
          !sv[item.key]
      );

    const percent =
      totalStudents === 0
        ? 0
        : Math.round(
            (passed.length /
              totalStudents) *
              100
          );

    return (
      <tr
        key={item.key}
        style={{
          borderTop:
            "1px solid #e2e8f0",
        }}
      >
        <td
          style={{
            padding:
              "14px 0",
            fontWeight:
              500,
          }}
        >
          {item.label}
        </td>

        <td
          style={{
            textAlign:
              "center",
          }}
        >
          <span
            onClick={() =>
              showStudents(
                `${item.label} - Đạt`,
                passed
              )
            }
            style={{
              color:
                "#16a34a",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            {passed.length}
          </span>
        </td>

        <td
          style={{
            textAlign:
              "center",
          }}
        >
          <span
            onClick={() =>
              showStudents(
                `${item.label} - Chưa đạt`,
                failed
              )
            }
            style={{
              color:
                "#dc2626",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            {failed.length}
          </span>
        </td>

        <td
          style={{
            textAlign:
              "center",
            fontWeight:
              600,
          }}
        >
          {percent}%
        </td>
      </tr>
    );
  }
)}

  </tbody>
</table>
</div>
      {/* THỐNG KÊ MỨC ĐỘ */}

     <div
  style={{
    flex: 1,
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    marginBottom: "30px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
 
 <table
  style={{
    width: "85%",
    margin: "auto 0",
    borderCollapse: "collapse",
  }}
>
    <thead>
      <tr>
        <th
          style={{
            width: "50%",
            textAlign: "left",
            padding: "12px",
            borderBottom:
              "0px solid #e2e8f0",
          }}
        >
          Mức độ hoàn thành
        </th>

        <th
          style={{
            width: "25%",
            textAlign: "center",
            padding: "12px",
            borderBottom:
              "1px solid #e2e8f0",
          }}
        >
          Số sinh viên
        </th>

        <th
          style={{
            width: "25%",
            textAlign: "center",
            padding: "12px",
            borderBottom:
              "1px solid #e2e8f0",
          }}
        >
          Tỷ lệ
        </th>
      </tr>
    </thead>

    <tbody>
      {Object.entries(completionStats).map(
        ([key, list]) => (
          <tr
            key={key}
            style={{
              borderBottom:
                "1px solid #f1f5f9",
            }}
          >
            <td
              style={{
                padding: "14px 12px",
              }}
            >
              {key}
            </td>

            <td
              style={{
                padding: "14px 12px",
                textAlign: "center",
                cursor: "pointer",
                color: "#2563eb",
                fontWeight: 600,
              }}
              onClick={() =>
                showStudents(
                  `${key} tiêu chí`,
                  list
                )
              }
            >
              {list.length}
            </td>

            <td
              style={{
                padding: "14px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {totalStudents === 0
                ? 0
                : Math.round(
                    (list.length /
                      totalStudents) *
                      100
                  )}
              %
            </td>
          </tr>
        )
      )}
    </tbody>
  </table>
  </div>
</div>
{selectedStudents.length > 0 && (
  <div
    style={{
      background: "white",
      padding: "10px 12px",
      borderRadius: "10px",
      marginTop: "20px",
      marginBottom: "20px",
      boxShadow:
        "0 2px 10px rgba(0,0,0,0.08)",
    }}
  >
    <div
  style={{
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "15px",
  }}
>
  <h2>{selectedTitle}</h2>

  <input
    placeholder="🔍 Tìm MSSV hoặc họ tên..."
    value={studentSearch}
    onChange={(e) =>
      setStudentSearch(
        e.target.value
      )
    }
    style={{
      width: "320px",
      padding: "10px",
      border:
        "1px solid #dbe2ea",
      borderRadius: "8px",
    }}
  />
</div>

   <table
  style={{
    width: "85%",
    margin: "20px auto 0",
    borderCollapse: "collapse",
  }}
>
      <thead>
        <tr
          style={{
            background: "#f8fafc",
          }}
        >
          <th
  style={{
    width: "60px",
    padding: "12px",
    textAlign: "center",
  }}
>
  STT
</th>

          <th
            style={{
              padding: "12px",
              textAlign: "left",
            }}
          >
            Họ tên
          </th>

          <th
            style={{
              padding: "12px",
              textAlign: "left",
            }}
          >
            Lớp
          </th>

          <th
            style={{
              padding: "12px",
              textAlign: "left",
            }}
          >
            MSSV
          </th>
        </tr>
      </thead>

      <tbody>
       {sortedStudents.map(
  (sv, index) => (
    <tr
      key={sv.id}
      style={{
        borderBottom:
          "1px solid #e2e8f0",
      }}
    >
      <td
        style={{
          padding: "12px",
        }}
      >
        {index + 1}
      </td>

      <td
        style={{
          padding: "12px",
        }}
      >
        {sv.ho_ten}
      </td>

      <td
        style={{
          padding: "12px",
        }}
      >
        {sv.lop}
      </td>

      <td
        style={{
          padding: "12px",
        }}
      >
        {sv.mssv}
      </td>
    </tr>
))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
}