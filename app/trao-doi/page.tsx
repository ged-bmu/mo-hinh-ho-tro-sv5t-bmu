"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentChat from "./StudentChat";
import AdminChat from "./AdminChat";
import Spinner from "../components/Spinner";

export default function TraoDoiPage() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);

  const [role, setRole] = useState<
    "admin" | "user" | null
  >(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/introduce";
      return;
    }

    setUser(user);

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data) {
      setRole(data.role);
    }

    setLoading(false);
  }

if (loading) {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

  if (role === "admin") {
    return <AdminChat />;
  }

  return <StudentChat user={user} />;
}