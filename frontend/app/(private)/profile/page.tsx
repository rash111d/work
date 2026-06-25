"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { SkillPicker } from "@/components/forms/skill-picker";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import type { Dashboard, Skill } from "@/types/api";
import { names } from "@/utils/format";

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    bio: user?.bio ?? "",
    university: user?.university ?? "",
    course: user?.course ?? 1,
    city: user?.city ?? "",
    skills: user ? names(user.skills) : []
  });
  const [error, setError] = useState("");

  useEffect(() => {
    api.skills().then(setSkills);
    api.dashboard().then(setDashboard);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        bio: user.bio,
        university: user.university,
        course: user.course,
        city: user.city,
        skills: names(user.skills)
      });
    }
  }, [user]);

  const save = async () => {
    setError("");
    try {
      const updated = await api.updateMe(form);
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const updated = await api.uploadAvatar(file);
    setUser(updated);
    await refreshUser();
  };

  if (!user) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid gap-6 animate-in">
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr_260px]">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.name} src={user.avatar_url} size={128} />
            <label className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold transition hover:bg-surface">
              <Upload size={16} />
              Фото
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} />
            </label>
          </div>
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="mt-1 text-muted">
                  Студент {user.course} курс, {user.university}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setEditing((prev) => !prev)}>
                {editing ? "Закрыть" : "Редактировать профиль"}
              </Button>
            </div>
            <div className="mt-6">
              <h2 className="font-bold">О себе</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{user.bio || "Описание пока не заполнено."}</p>
            </div>
            <div className="mt-6">
              <h2 className="font-bold">Навыки</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Badge key={skill.id} tone="brand">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Info label="Email" value={user.email} />
            <Info label="Курс" value={`${user.course}`} />
            <Info label="Университет" value={user.university || "Не указан"} />
            <Info label="Город" value={user.city || "Не указан"} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-sm font-semibold text-muted">Проекты</p>
          <p className="mt-2 text-4xl font-bold">{dashboard?.stats.projects ?? 0}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-sm font-semibold text-muted">Заявки</p>
          <p className="mt-2 text-4xl font-bold">{dashboard?.my_applications.length ?? 0}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-sm font-semibold text-muted">Рейтинг</p>
          <p className="mt-2 text-4xl font-bold">{user.rating.toFixed(1)}</p>
        </Card>
      </div>

      {editing ? (
        <Card className="p-5">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Имя">
                <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </Field>
              <Field label="Университет">
                <Input
                  value={form.university}
                  onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))}
                />
              </Field>
              <Field label="Курс">
                <Select value={form.course} onChange={(event) => setForm((prev) => ({ ...prev, course: Number(event.target.value) }))}>
                  {[1, 2, 3, 4, 5, 6].map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Город">
                <Input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              </Field>
            </div>
            <Field label="О себе">
              <Textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
            </Field>
            <Field label="Навыки">
              <SkillPicker skills={skills} value={form.skills} onChange={(next) => setForm((prev) => ({ ...prev, skills: next }))} />
            </Field>
            {error ? <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
            <Button onClick={save} className="w-full sm:w-fit">
              Сохранить
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
