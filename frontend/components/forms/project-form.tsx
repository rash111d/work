"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SkillPicker } from "@/components/forms/skill-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import type { Project, ProjectPayload, ProjectStatus, Skill } from "@/types/api";
import { names } from "@/utils/format";

const schema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  description: z.string().min(20, "Минимум 20 символов"),
  format: z.string().min(2, "Укажите формат"),
  deadline: z.string().min(1, "Выберите дедлайн"),
  status: z.enum(["open", "in_progress", "completed", "archived"]),
  capacity: z.number().min(2).max(30),
  stack: z.array(z.string()).min(1, "Выберите стек")
});

export function ProjectForm({
  project,
  submitLabel,
  onSubmit
}: {
  project?: Project;
  submitLabel: string;
  onSubmit: (payload: ProjectPayload) => Promise<void>;
}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState<ProjectPayload>(() => ({
    title: project?.title ?? "",
    description: project?.description ?? "",
    format: project?.format ?? "Online",
    deadline: project?.deadline ? toDateInput(project.deadline) : "",
    status: project?.status ?? "open",
    capacity: project?.capacity ?? 5,
    stack: project ? names(project.stack) : []
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.skills().then(setSkills).catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        description: project.description,
        format: project.format,
        deadline: toDateInput(project.deadline),
        status: project.status,
        capacity: project.capacity,
        stack: names(project.stack)
      });
    }
  }, [project]);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

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
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить проект");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Название проекта">
        <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
      </Field>
      <Field label="Описание">
        <Textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Формат">
          <Input value={form.format} onChange={(event) => setForm((prev) => ({ ...prev, format: event.target.value }))} />
        </Field>
        <Field label="Дедлайн">
          <Input
            type="date"
            min={minDate}
            value={form.deadline}
            onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
          />
        </Field>
        <Field label="Участников">
          <Input
            type="number"
            min={2}
            max={30}
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
          />
        </Field>
      </div>
      <Field label="Статус">
        <Select
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}
        >
          <option value="open">Открыт</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершен</option>
          <option value="archived">Архив</option>
        </Select>
      </Field>
      <Field label="Стек технологий">
        <SkillPicker skills={skills} value={form.stack} onChange={(next) => setForm((prev) => ({ ...prev, stack: next }))} />
      </Field>
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full sm:w-fit">
        {loading ? "Сохраняем..." : submitLabel}
      </Button>
    </form>
  );
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
