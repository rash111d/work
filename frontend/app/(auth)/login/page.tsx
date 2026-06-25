"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов")
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Проверьте данные");
      return;
    }
    setLoading(true);
    try {
      await login(parsed.data);
      if (!remember) {
        window.sessionStorage.setItem("edumatch.session-only", "1");
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-5">
      <section className="w-full max-w-sm animate-in">
        <p className="mb-5 text-base font-bold">EduMatch</p>
        <h1 className="text-2xl font-bold leading-tight">Найди команду для своих идей</h1>
        <p className="mt-1 text-sm text-muted">Общайтесь, создавайте, развивайтесь</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <Field label="Email">
            <Input
              type="email"
              placeholder="Введите ваш Email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </Field>
          <Field label="Пароль">
            <Input
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </Field>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand"
              />
              Запомнить меня
            </label>
          </div>
          {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Зарегистрироваться
          </Link>
        </p>
      </section>
    </main>
  );
}
