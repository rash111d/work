"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SkillPicker } from "@/components/forms/skill-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import type { Skill } from "@/types/api";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
  university: z.string().min(2, "Укажите университет"),
  course: z.number().min(1).max(6),
  skills: z.array(z.string()).min(1, "Выберите хотя бы один навык")
});

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    course: 1,
    skills: [] as string[]
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.skills().then(setSkills).catch(() => setSkills([]));
  }, []);

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
      await register(parsed.data);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-5 py-8">
      <section className="w-full max-w-md animate-in">
        <p className="mb-5 text-base font-bold">EduMatch</p>
        <h1 className="text-2xl font-bold leading-tight">Создайте профиль студента</h1>
        <p className="mt-1 text-sm text-muted">Навыки помогут подобрать проекты и тиммейтов</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <Field label="Имя">
            <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </Field>
          <Field label="Пароль">
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Университет">
              <Input
                value={form.university}
                onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))}
              />
            </Field>
            <Field label="Курс">
              <Select
                value={form.course}
                onChange={(event) => setForm((prev) => ({ ...prev, course: Number(event.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6].map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Навыки">
            <SkillPicker
              skills={skills}
              value={form.skills}
              onChange={(next) => setForm((prev) => ({ ...prev, skills: next }))}
            />
          </Field>
          {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Создаем..." : "Зарегистрироваться"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Войти
          </Link>
        </p>
      </section>
    </main>
  );
}
