"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(api.hasSession() ? "/dashboard" : "/login");
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">EduMatch</div>;
}
