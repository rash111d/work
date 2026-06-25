"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("edumatch.theme", next);
  };

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="mt-1 text-sm text-muted">Персональные параметры приложения.</p>
      </div>
      <Card className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-bold">Тема оформления</h2>
          <p className="mt-1 text-sm text-muted">{theme === "dark" ? "Темная" : "Светлая"}</p>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          Переключить
        </Button>
      </Card>
      <Card className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-bold">Сессия</h2>
          <p className="mt-1 text-sm text-muted">Выход завершит текущую refresh-сессию.</p>
        </div>
        <Button variant="danger" onClick={signOut}>
          Выйти
        </Button>
      </Card>
    </div>
  );
}
