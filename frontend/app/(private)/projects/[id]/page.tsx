"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, MessageCircle, Pencil, Trash2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { api } from "@/services/api";
import type { Project } from "@/types/api";
import { formatDate, statusLabel, statusTone } from "@/utils/format";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const projectID = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadingApply, setLoadingApply] = useState(false);

  useEffect(() => {
    api.project(projectID).then(setProject).catch((err) => setError(err instanceof Error ? err.message : "Ошибка"));
  }, [projectID]);

  const isOwner = project?.owner_id === user?.id;
  const isMember = useMemo(() => project?.members.some((member) => member.user_id === user?.id) ?? false, [project, user]);
  const isClosed = project?.status === "completed" || project?.status === "archived";

  const apply = async () => {
    if (isClosed) {
      setError("Проект завершен, заявки закрыты.");
      return;
    }
    setError("");
    setNotice("");
    setLoadingApply(true);
    try {
      await api.apply(projectID, message);
      setNotice("Заявка отправлена организатору.");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    } finally {
      setLoadingApply(false);
    }
  };

  const remove = async () => {
    if (!project || !window.confirm("Удалить проект?")) {
      return;
    }
    await api.deleteProject(project.id);
    router.replace("/projects");
  };

  const exportPdf = () => {
    if (!project) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    const stack = project.stack.map((skill) => skill.name).join(", ");
    popup.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(project.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
    h1 { font-size: 28px; margin-bottom: 12px; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 24px 0; }
    .box { border: 1px solid #dbe0e7; border-radius: 8px; padding: 14px; }
    .label { color: #667085; font-size: 12px; font-weight: 700; }
    .value { margin-top: 6px; font-weight: 700; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${escapeHtml(project.title)}</h1>
  <p>${escapeHtml(project.description)}</p>
  <div class="meta">
    <div class="box"><div class="label">Статус</div><div class="value">${escapeHtml(statusLabel(project.status))}</div></div>
    <div class="box"><div class="label">Дедлайн</div><div class="value">${escapeHtml(formatDate(project.deadline))}</div></div>
    <div class="box"><div class="label">Формат</div><div class="value">${escapeHtml(project.format)}</div></div>
    <div class="box"><div class="label">Команда</div><div class="value">${project.members.length} / ${project.capacity}</div></div>
  </div>
  <div class="box"><div class="label">Стек</div><div class="value">${escapeHtml(stack)}</div></div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
    popup.document.close();
  };

  if (error && !project) {
    return <p className="rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>;
  }

  if (!project) {
    return <Skeleton className="h-[520px]" />;
  }

  return (
    <div className="grid gap-6 animate-in">
      <Link href="/projects" className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} />
        Назад к списку
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {project.stack.map((skill) => (
                  <Badge key={skill.id} tone="brand">
                    {skill.name}
                  </Badge>
                ))}
                <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
              </div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{project.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={exportPdf}>
                <Download size={16} />
                PDF
              </Button>
              {isOwner ? (
                <>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="secondary">
                      <Pencil size={16} />
                      Редактировать
                    </Button>
                  </Link>
                  <Button variant="danger" onClick={remove}>
                    <Trash2 size={16} />
                    Удалить
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <Card className="grid gap-4 p-5 sm:grid-cols-4">
            <Metric label="Дедлайн" value={formatDate(project.deadline)} />
            <Metric label="Формат" value={project.format} />
            <Metric label="Участники" value={`${project.members.length} / ${project.capacity}`} />
            <Metric label="Создатель" value={project.owner.name} />
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Участники команды</h2>
              {isMember ? (
                <Link href={`/projects/${project.id}/chat`}>
                  <Button variant="secondary">
                    <MessageCircle size={16} />
                    Чат
                  </Button>
                </Link>
              ) : null}
            </div>
            <div className="grid gap-3">
              {project.members.map((member) => (
                <Link
                  href={`/profile/${member.user_id}`}
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-surface"
                >
                  <Avatar name={member.user.name} src={member.user.avatar_url} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{member.user.name}</p>
                      <Badge tone={member.role === "creator" ? "brand" : "neutral"}>{memberRoleLabel(member.role)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {member.user.course} курс, {member.user.university}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <aside className="grid gap-4 self-start">
          <Card className="p-5">
            <h2 className="font-bold">Организатор</h2>
            <Link href={`/profile/${project.owner_id}`} className="mt-4 flex items-center gap-3">
              <Avatar name={project.owner.name} src={project.owner.avatar_url} size={56} />
              <div>
                <p className="font-semibold">{project.owner.name}</p>
                <p className="text-sm text-muted">
                  {project.owner.course} курс, {project.owner.university}
                </p>
              </div>
            </Link>
          </Card>

          {!isOwner && !isMember && !isClosed ? (
            <Card className="p-5">
              <h2 className="font-bold">Подать заявку</h2>
              <Textarea
                className="mt-4"
                placeholder="Коротко расскажите, чем можете быть полезны проекту"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              {notice ? <p className="mt-3 rounded-lg bg-success/10 p-3 text-sm text-success">{notice}</p> : null}
              {error ? <p className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
              <Button className="mt-4 w-full" onClick={apply} disabled={loadingApply}>
                <UserPlus size={16} />
                {loadingApply ? "Отправляем..." : "Подать заявку"}
              </Button>
            </Card>
          ) : null}
          {!isOwner && !isMember && isClosed ? (
            <Card className="p-5">
              <h2 className="font-bold">Заявки закрыты</h2>
              <p className="mt-2 text-sm text-muted">Проект завершен, поэтому отправить заявку уже нельзя.</p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}

function memberRoleLabel(role: Project["members"][number]["role"]) {
  return role === "creator" ? "Создатель" : "Участник";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}
