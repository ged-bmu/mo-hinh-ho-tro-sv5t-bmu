"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import CriteriaModal from "../components/CriteriaModal";
import { supabase } from "@/lib/supabase";

export default function BangDiemPage() {

  const [showSemester3, setShowSemester3] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState("proof");
  const [subjectsHK1, setSubjectsHK1] = useState<any[]>([]);
  const [subjectsHK2, setSubjectsHK2] = useState<any[]>([]);
  const [subjectsSummer, setSubjectsSummer] = useState<any[]>([]);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<"hk1" | "hk2" | "summer">("hk1");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [examInputs, setExamInputs] = useState<any>({});
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
  useEffect(() => {

    loadSubjects();

  }, []);



  async function loadSubjects(){

    const {
      data:user
    } = await supabase.auth.getUser();


    if(!user.user){
      console.log("Chưa đăng nhập");
      return;
    }



    const {
      data,
      error
    } = await supabase
      .from("subjects")
      .select("*")
      .eq(
        "user_id",
        user.user.id
      )
      .order(
        "created_at",
        {
          ascending:true
        }
      );

if(error){
  console.log("LỖI LƯU MÔN:", error);
  alert(error.message);
  return;
}
    setSubjectsHK1(
      data.filter(
        (s)=>s.semester==="hk1"
      )
    );
    setSubjectsHK2(
      data.filter(
        (s)=>s.semester==="hk2"
      )
    );
    setSubjectsSummer(
      data.filter(
        (s)=>s.semester==="summer"
      )
    );
  }
  async function addSubject(subject:any){
      console.log("BẮT ĐẦU LƯU:", subject);
    const {
      data:user
    } = await supabase.auth.getUser();
    if(!user.user) return;
    const {
      error
    } = await supabase
      .from("subjects")
      .insert({
        ...subject,
        user_id:user.user.id,
        semester:currentSemester

      });
    if(error){
      console.log(error);
      return;
    }
    loadSubjects();
  }
async function deleteSubject(id:number){

  console.log("ĐANG XÓA:", id);

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq(
      "id",
      id
    );


  if(error){
    console.log("LỖI XÓA:", error);
    return;
  }


  console.log("XÓA THÀNH CÔNG");

  loadSubjects();

}




  // ==========================
  // CẬP NHẬT MÔN
  // ==========================

  async function updateSubject(subject:any){


    const {
      id,
      ...updateData
    } = subject;



    const {
      error
    } = await supabase
      .from("subjects")
      .update(updateData)
      .eq(
        "id",
        id
      );



    if(error){
      console.log(error);
      return;
    }


    loadSubjects();

  }

const allSubjects = [
  ...subjectsHK1,
  ...subjectsHK2,
  ...subjectsSummer,
];

const totalCreditsYear = allSubjects.reduce(
  (sum, s) => sum + (s.credits ?? 0),
  0
);

const gpa10Year =
  totalCreditsYear === 0
    ? 0
    : allSubjects.reduce(
        (sum, s) => sum + (s.total ?? 0) * s.credits,
        0
      ) / totalCreditsYear;

const letterTo4: any = {
  A: 4,
  "B+": 3.5,
  B: 3,
  "C+": 2.5,
  C: 2,
  "D+": 1.5,
  D: 1,
  F: 0,
};

const gpa4Year =
  totalCreditsYear === 0
    ? 0
    : allSubjects.reduce(
        (sum, s) =>
          sum +
          (letterTo4[getLetter(s.total ?? 0)] ?? 0) *
            s.credits,
        0
      ) / totalCreditsYear;
  return (
    <>
     <Header
  tab={tab}
  setTab={setTab}
  openCriteria={() => setShowCriteria(true)}
  openProfile={() => setShowProfile(true)}
/>

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 120px)",
          background: "#f6f8fb",
        }}
      >
        <Sidebar />

        <main
  style={{
    flex: 1,
    minWidth: 0,
    padding: isMobile ? "20px 12px" : "32px",
    boxSizing: "border-box",
  }}
>
          <h1
  style={{
    fontSize: isMobile ? 24 : 30,
    fontWeight: 700,
    marginBottom: 8,
  }}
>
  📚 Mục tiêu học tập
</h1>

         <p
  style={{
    color: "#666",
    marginBottom: isMobile ? 20 : 30,
    fontSize: isMobile ? 14 : 16,
  }}
>
  Quản lý điểm trung bình từng học kỳ.
</p>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
    marginBottom: 20,
  }}
>
  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: "14px 18px",
      boxShadow: "0 3px 10px rgba(0,0,0,.06)",
    }}
  >
    <div
      style={{
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 6,
      }}
    >
      Tổng số tín chỉ
    </div>

    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {totalCreditsYear}
    </div>
  </div>

  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: "14px 18px",
      boxShadow: "0 3px 10px rgba(0,0,0,.06)",
    }}
  >
    <div
      style={{
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 6,
      }}
    >
      GPA cả năm (Hệ 10)
    </div>

    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: "#2563eb",
      }}
    >
      {gpa10Year.toFixed(2)}
    </div>
  </div>

  <div
    style={{
      background: "#fff",
      borderRadius: 12,
      padding: "14px 18px",
      boxShadow: "0 3px 10px rgba(0,0,0,.06)",
    }}
  >
    <div
      style={{
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 6,
      }}
    >
      GPA cả năm (Hệ 4)
    </div>

    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: "#16a34a",
      }}
    >
      {gpa4Year.toFixed(2)}
    </div>
  </div>
</div>
<SemesterCard
  title="Học kỳ I"
  subjects={subjectsHK1}
  isMobile={isMobile}
onUpdateSubject={(subject)=>{
  updateSubject(subject);
}}
   onScore={(subject)=>{
   setSelectedSubject(subject);
   setShowScoreModal(true);
 }}
onDelete={(id) => {
  deleteSubject(id);
}}
openAddSubject={() => {
  setEditingSubject(null);
  setCurrentSemester("hk1");
  setShowAddSubject(true);
}}
  onEdit={(subject) => {
    setCurrentSemester("hk1");
    setEditingSubject(subject);
    setShowAddSubject(true);
  }}
/>

<SemesterCard
  title="Học kỳ II"
  subjects={subjectsHK2}
  isMobile={isMobile}
onUpdateSubject={(subject)=>{
  updateSubject(subject);
}}
  onScore={(subject)=>{
   setSelectedSubject(subject);
   setShowScoreModal(true);
 }}
onDelete={(id) => {
  deleteSubject(id);
}}
openAddSubject={() => {
  setEditingSubject(null);
  setCurrentSemester("hk2");
  setShowAddSubject(true);
}}
  onEdit={(subject) => {
    setCurrentSemester("hk2");
    setEditingSubject(subject);
    setShowAddSubject(true);
  }}
/>

          {showSemester3 && (
<SemesterCard
  title="Học kỳ hè"
  subjects={subjectsSummer}
  isMobile={isMobile}
onUpdateSubject={(subject)=>{
  updateSubject(subject);
}}
  onScore={(subject)=>{
   setSelectedSubject(subject);
   setShowScoreModal(true);
 }}
onDelete={(id) => {
  deleteSubject(id);
}}
openAddSubject={() => {
  setEditingSubject(null);
  setCurrentSemester("summer");
  setShowAddSubject(true);
}}
  onEdit={(subject) => {
    setCurrentSemester("summer");
    setEditingSubject(subject);
    setShowAddSubject(true);
  }}
/>
          )}

          <div
            style={{
              marginTop: 20,
            }}
          >
            {!showSemester3 ? (
              <button
                onClick={() => setShowSemester3(true)}
                style={buttonStyle}
              >
                + Thêm học kỳ hè
              </button>
            ) : (
              <button
                onClick={() => setShowSemester3(false)}
                style={{
                  ...buttonStyle,
                  background: "#ef4444",
                }}
              >
                🗑 Xóa học kỳ hè
              </button>
            )}
          </div>
        </main>
      </div>

      {showCriteria && (
        <CriteriaModal
          onClose={() => setShowCriteria(false)}
        />
      )}

      {showAddSubject && (
       <AddSubjectModal
  editingSubject={editingSubject}
  onClose={() => setShowAddSubject(false)}
  onEdit={(subject) => {
  if (currentSemester === "hk1") {
    setSubjectsHK1(prev =>
      prev.map(s => s.id === subject.id ? subject : s)
    );
  } else if (currentSemester === "hk2") {
    setSubjectsHK2(prev =>
      prev.map(s => s.id === subject.id ? subject : s)
    );
  } else {
    setSubjectsSummer(prev =>
      prev.map(s => s.id === subject.id ? subject : s)
    );
  }

  setShowAddSubject(false);
}}
onAdd={async (subject) => {

  await addSubject(subject);

  setShowAddSubject(false);

}}
/>
      )}
{showScoreModal && selectedSubject && (
  <ScoreModal
    subject={selectedSubject}

    onClose={()=>{
      setShowScoreModal(false);
    }}

   onSave={(updated)=>{

  updateSubject(updated);

  setShowScoreModal(false);

}}
  />
)}
      <Footer />
    </>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 22px",
  border: "none",
  borderRadius: 12,
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(37,99,235,.25)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: 15,
};
type SemesterCardProps = {
  title: string;
  openAddSubject: () => void;
  onScore: (subject: any) => void;
  subjects: any[];
  onEdit: (subject: any) => void;
  onUpdateSubject: (subject: any) => void;
  onDelete: (id: number) => void;
  isMobile: boolean;
};

function SemesterCard({
  title,
  openAddSubject,
  subjects,
  onEdit,
  onUpdateSubject,
  onDelete,
  onScore,
  isMobile,
}: SemesterCardProps) {
const [examInputs, setExamInputs] = useState<Record<number, string>>({});
const totalCredits = subjects.reduce(
  (sum, s) => sum + s.credits,
  0
);

const gpa =
  totalCredits === 0
    ? 0
    : subjects.reduce(
        (sum, s) => sum + s.total * s.credits,
        0
      ) / totalCredits;
      const gpa10 =
  totalCredits === 0
    ? 0
    : subjects.reduce(
        (sum, s) => sum + (s.total ?? 0) * s.credits,
        0
      ) / totalCredits;

const letterTo4: any = {
  "A": 4.0,
  "B+": 3.5,
  "B": 3.0,
  "C+": 2.5,
  "C": 2.0,
  "D+": 1.5,
  "D": 1.0,
  "F": 0,
};

const gpa4 =
  totalCredits === 0
    ? 0
    : subjects.reduce(
        (sum, s) =>
          sum +
          (letterTo4[getLetter(s.total ?? 0)] ?? 0) *
            s.credits,
        0
      ) / totalCredits;

const expectedGpa4 =
  totalCredits === 0
    ? 0
    : subjects.reduce(
        (sum, s) =>
          sum +
          (letterTo4[s.targetScore ?? "A"] ?? 0) *
            s.credits,
        0
      ) / totalCredits;

  return (
    <div
  style={{
    background: "#fff",
    borderRadius: 18,
    padding: isMobile ? 14 : 24,
    marginBottom: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,.08)",
  }}
>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
            }}
          >
            {title}
          </h2>
        </div>

        <button
          onClick={openAddSubject}
          style={{
            padding: "11px 18px",
            border: "none",
            borderRadius: 10,
            background: "#16a34a",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Thêm môn
        </button>
      </div>

      {/* Table */}
      <div
  style={{
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",
  }}
>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 850,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#eff6ff",
              }}
            >
              <th style={thStyle}>STT</th>
              <th style={thStyle}>Tên học phần</th>
              <th style={thStyle}>Tín chỉ</th>

              <th style={thStyle}>Điểm thành phần</th>

<th style={thStyle}>Mục tiêu</th>

<th style={thStyle}>
Điểm thi cần đạt
</th>

<th style={thStyle}>
Điểm thi
</th>

<th style={thStyle}>Tổng</th>

<th style={thStyle}>Điểm chữ</th>

<th style={thStyle}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((s, index) => (
              <tr key={s.id}>
                <td style={tdStyle}>{index + 1}</td>

                <td style={tdStyle}>{s.name}</td>

                <td style={tdStyle}>{s.credits}</td>
                <td style={tdStyle}>
  <button
    onClick={() => onScore(s)}
    style={{
      background:"#8b5cf6",
      color:"#fff",
      border:"none",
      borderRadius:8,
      padding:"7px 12px",
      cursor:"pointer"
    }}
  >
    Nhập điểm
  </button>
</td>




{/* Điểm chữ mong muốn */}
<td style={tdStyle}>
  <select
    value={s.targetScore || "A"}
    onChange={(e)=>{

      const target = e.target.value;

onUpdateSubject({
  ...s,
  targetScore: target
});

    }}
  >

    {[
      "A",
      "B+",
      "B",
      "C+",
      "C",
      "D+",
      "D"
    ].map(x=>(
      <option key={x}>
        {x}
      </option>
    ))}

  </select>
</td>



{/* Thi cần đạt */}
<td style={tdStyle}>
{
(
(
letterTargets[s.targetScore || "A"]
-
s.process
)
/
examWeight[s.type]
).toFixed(2)
}
</td>


{/* Điểm thi thực tế */}
<td style={tdStyle}>
<input
type="number"
step="0.01"
min="0"
max="10"
value={
  examInputs[s.id] !== undefined
    ? examInputs[s.id]
    : s.examScore ?? ""
}
onChange={(e)=>{

  const value = e.target.value;

  setExamInputs({
    ...examInputs,
    [s.id]: value
  });

}}
onBlur={()=>{

 const raw = examInputs[s.id];

 if(raw === undefined || raw === ""){
   return;
 }

 const exam = Number(raw);

 const total =
   s.process +
   exam * examWeight[s.type];


 onUpdateSubject({
   ...s,
   examScore: exam,
   total:Number(total.toFixed(2)),
   letter:getLetter(Number(total.toFixed(2)))
 });

}}
/>


</td>


{/* Tổng */}
<td style={tdStyle}>
{
s.total || "-"
}
</td>

                <td style={tdStyle}>
  {s.total != null ? getLetter(s.total) : "-"}
</td>

                <td style={tdStyle}>
                 <button
  onClick={() => onEdit(s)}
  style={{
    marginRight: 8,
    border: "none",
    background: "#ffff72",
    color: "#fff",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
  }}
>
  ✏️
</button>

                 <button
  onClick={() => {
    if (confirm("Bạn có chắc muốn xóa môn học này?")) {
      onDelete(s.id);
    }
  }}
  style={{
    border: "none",
    background: "#ef4444",
    color: "#fff",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
  }}
>
  🗑
</button>
                </td>
              </tr>
            ))}

            {subjects.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  Chưa có môn học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 16,
    marginTop: 24,
    borderTop: "1px solid #eee",
    paddingTop: 20,
  }}
>

  <div>
    <b>Tổng số tín chỉ</b>
    <div style={{ fontSize: 16, marginTop: 6 }}>
      {totalCredits}
    </div>
  </div>

  <div>
    <b>ĐTB học kỳ (Hệ 10)</b>
    <div
      style={{
        fontSize: 16,
        color: "#2563eb",
        marginTop: 6,
      }}
    >
      {gpa10.toFixed(2)}
    </div>
  </div>

  <div>
    <b>ĐTB học kỳ (Hệ 4)</b>
    <div
      style={{
        fontSize: 16,
        color: "#16a34a",
        marginTop: 6,
      }}
    >
      {gpa4.toFixed(2)}
    </div>
  </div>

  <div>
    <b>ĐTB HK mục tiêu (Hệ 4)</b>
    <div
      style={{
        fontSize: 16,
        color: "#f59e0b",
        marginTop: 6,
      }}
    >
      {expectedGpa4.toFixed(2)}
    </div>
  </div>
</div>
</div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  padding: 12,
  textAlign: "center",
  fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 12,
  textAlign: "center",
};
type SubjectType = "LT" | "TH" | "LTTH" | "LS";
const letterTargets:any = {
  "A": 8.5,
  "B+": 7.8,
  "B": 7.0,
  "C+": 6.3,
  "C": 5.5,
  "D+": 5,
  "D": 4,
};
const examWeight:any = {
  LT: 0.65,
  TH: 0.60,
  LTTH: 0.50,
  LS: 0.60,
};
function getLetter(total:number){

  if(total >= 8.5) return "A";
  if(total >= 7.8) return "B+";
  if(total >= 7.0) return "B";
  if(total >= 6.5) return "C+";
  if(total >= 5.5) return "C";
  if(total >= 5.0) return "D+";
  if(total >= 4.0) return "D";

  return "F";
}
const point4: any = {
  A: 4.0,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  "D+": 1.5,
  D: 1.0,
  F: 0,
};
const scoreParts = {
  LT: [
    "Chuyên cần 5%",
    "Kiểm tra 30%",
    "Thi KTHP 65%",
  ],

  TH: [
    "Quá trình 40%",
    "Thi KTHP 60%",
  ],

  LTTH: [
    "Chuyên cần 5%",
    "Kiểm tra 15%",
    "Thực hành 30%",
    "Thi KTHP 50%",
  ],

  LS: [
    "Chuyên cần 10%",
    "Quá trình 30%",
    "Thi KTHP 60%",
  ],
};

function AddSubjectModal({
  onClose,
  onAdd,
  onEdit,
  editingSubject,
}: {
  onClose: () => void;
  onAdd: (subject: any) => void;
  onEdit: (subject: any) => void;
  editingSubject: any;
}) {
const [name, setName] = useState(editingSubject?.name || "");
const [credits, setCredits] = useState(editingSubject?.credits || 2);
const [type, setType] = useState<SubjectType>(
  editingSubject?.type || "LT"
);

  const parts = {
    LT: [
      { name: "Chuyên cần", weight: 5 },
      { name: "Giữa kỳ", weight: 30 },
      { name: "Thi KTHP", weight: 65 },
    ],

    TH: [
      { name: "Quá trình", weight: 40 },
      { name: "Thi KTHP", weight: 60 },
    ],

    LTTH: [
      { name: "Chuyên cần", weight: 5 },
      { name: "Kiểm tra", weight: 15 },
      { name: "Thực hành", weight: 30 },
      { name: "Thi KTHP", weight: 50 },
    ],

    LS: [
      { name: "Chuyên cần", weight: 10 },
      { name: "Quá trình", weight: 30 },
      { name: "Thi KTHP", weight: 60 },
    ],
  };
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    borderTop: "1px solid #eee",
    paddingTop: 18,
    flexWrap: "wrap",
    gap: 20,
    fontSize: 15,
  }}
>

</div>
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        justifyContent: "center",
alignItems: "flex-start",
padding: "20px 0",
overflowY: "auto",
        zIndex: 999,
      }}
    >
      <div
  style={{
    width: 560,
    maxWidth: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 15px 35px rgba(0,0,0,.15)",
  }}
>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
          }}
        >
          ➕ Thêm học phần
        </h2>

        {/* Tên môn */}
        <div style={{ marginBottom: 18 }}>
          <label>
            <b>Tên học phần</b>
          </label>

          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
        </div>

        {/* Tín chỉ */}
        <div style={{ marginBottom: 18 }}>
          <label>
            <b>Số tín chỉ</b>
          </label>

          <input
            type="number"
            min={1}
            value={credits}
            onChange={(e) =>
              setCredits(Number(e.target.value))
            }
            style={inputStyle}
          />
        </div>

        {/* Loại môn */}
        <div style={{ marginBottom: 25 }}>
          <label>
            <b>Loại học phần</b>
          </label>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as SubjectType)
            }
            style={inputStyle}
          >
            <option value="LT">
              Lý thuyết
            </option>

            <option value="TH">
              Thực hành
            </option>

            <option value="LTTH">
              Lý thuyết + Thực hành
            </option>

            <option value="LS">
              Lâm sàng
            </option>
          </select>
        </div>

        {/* Thành phần điểm */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: 14,
            }}
          >
            Thành phần điểm
          </h4>

          {parts[type].map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom:
                  "1px dashed #dbe3ee",
              }}
            >
              <span>{item.name}</span>

              <b>{item.weight}%</b>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div
          style={{
            background: "#eef6ff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <b>Môn học:</b>{" "}
            {name || "Chưa nhập"}
          </div>

          <div
            style={{
              marginTop: 8,
            }}
          >
            <b>Tín chỉ:</b> {credits}
          </div>

          <div
            style={{
              marginTop: 8,
            }}
          >
            <b>Loại:</b> {type}
          </div>
        </div>

        {/* Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>

         <button
onClick={() => {
const subject = {
  id: editingSubject ? editingSubject.id : Date.now(),
  name,
  credits,
  type,

  scores: editingSubject?.scores || {},

  process: editingSubject?.process ?? 0,
  final: editingSubject?.final ?? 0,
  total: editingSubject?.total ?? 0,
  letter: editingSubject?.letter ?? "-",
targetScore: editingSubject?.targetScore ?? "A",
examScore: editingSubject?.examScore ?? 0,
};

if (editingSubject) {
    console.log("ĐANG EDIT", subject);
    onEdit(subject);
  } else {
    console.log("ĐANG ADD", subject);
    onAdd(subject);
  }

  onClose();
}}
  style={{
    padding: "11px 18px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  {editingSubject ? "Lưu thay đổi" : "Thêm học phần"}
</button>
        </div>
      </div>
    </div>
  );
}
function ScoreModal({
  subject,
  onClose,
  onSave,
}: {
  subject: {
    id:number;
    name:string;
    type: SubjectType;
    scores:any;
  };
  onClose:()=>void;
  onSave:(subject:any)=>void;
}) {

  const scoreParts = {
    LT: [
      { name: "Chuyên cần", weight: 5 },
      { name: "Giữa kỳ", weight: 30 },
    ],

    TH: [
      { name: "Quá trình", weight: 40 },
    ],

    LTTH: [
      { name: "Chuyên cần", weight: 5 },
      { name: "Kiểm tra", weight: 15 },
      { name: "Thực hành", weight: 30 },
    ],

    LS: [
      { name: "Chuyên cần", weight: 10 },
      { name: "Quá trình", weight: 20 },
    ],
  };


  const [scores, setScores] = useState(
    subject.scores || {}
  );


  return (
    <div
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,.45)",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        zIndex:1000
      }}
    >

      <div
        style={{
          background:"#fff",
          width:450,
          padding:25,
          borderRadius:18
        }}
      >

        <h2>
          📝 Nhập điểm {subject.name}
        </h2>


        {scoreParts[subject.type].map((item)=>(
          <div
            key={item.name}
            style={{
              marginBottom:15
            }}
          >

            <label>
              <b>
                {item.name} ({item.weight}%)
              </b>
            </label>


            <input
              type="number"
              min="0"
              max="10"
              value={scores[item.name] || ""}
              onChange={(e)=>{

                setScores({
                  ...scores,
                  [item.name]: Number(e.target.value)
                })

              }}
              style={inputStyle}
            />

          </div>
        ))}



        <button
          style={buttonStyle}
          onClick={()=>{

            let process = 0;


            scoreParts[subject.type].forEach((item)=>{

              process += 
              (scores[item.name] || 0)
              *
              item.weight
              /
              100;

            });


            onSave({
              ...subject,
              scores,
              process:Number(process.toFixed(2))
            });


          }}
        >
          Lưu điểm
        </button>


        <button
          onClick={onClose}
          style={{
            marginLeft:10,
            padding:"12px 20px",
            borderRadius:10,
            border:"1px solid #ddd"
          }}
        >
          Hủy
        </button>


      </div>

    </div>
  );

}