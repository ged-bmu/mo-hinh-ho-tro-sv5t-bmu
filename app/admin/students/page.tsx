"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("mssv");

    if (data) {
      setStudents(data);
    }
  }

  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>👥 Danh sách sinh viên</h1>

      {students.map((student) => (
        <div
          key={student.id}
          style={{
            background: "white",
            padding: "15px 20px",
            marginTop: "12px",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <b>{student.ho_ten}</b>
            <br />
            MSSV: {student.mssv}
            <br />
            Lớp: {student.lop}
          </div>

          <a
            href={`/admin/students/${student.id}`}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 15px",
              borderRadius: "8px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
            }}
          >
            <Image src="/iconxem2.png" width={20} height={20} alt="Xem hồ sơ" />
            Xem hồ sơ
          </a>
        </div>
      ))}
    </main>
  );
}