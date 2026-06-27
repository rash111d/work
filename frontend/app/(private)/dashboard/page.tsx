"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Clock3, FolderKanban, Users } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { Card, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { Dashboard, Project } from "@/types/api";
import { formatDate, statusLabel, statusTone } from "@/utils/format";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setDashboard).catch((err) => setError(err instanceof Error ? err.message : "Ошибка"));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</p>;
  }

  if (!dashboard) {
    return <DashboardSkeleton />;
  }

  const stats = [
    { label: "Мои проекты", value: dashboard.my_projects.length, icon: FolderKanban, hint: "Созданы вами" },
    { label: "Я участвую", value: dashboard.joined_projects.length, icon: Users, hint: "В командах" },
    { label: "Мои заявки", value: dashboard.stats.pending_applications, icon: Clock3, hint: "На рассмотрении" },
    { label: "Уведомления", value: dashboard.stats.notifications, icon: Bell, hint: "Непрочитанные" }
  ];

  return (
    <div className="grid gap-8 animate-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Добро пожаловать, {user?.name?.split(" ")[0] ?? "студент"}!</h1>
          <p className="mt-1 text-sm text-muted">Ваши проекты, заявки и свежая активность собраны здесь.</p>
        </div>
        <Button onClick={() => window.location.assign("/projects/new")}>Создать проект</Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon size={16} />
                </span>
                {item.label}
              </div>
              <p className="mt-4 text-4xl font-bold">{item.value}</p>
              <p className="mt-1 text-xs text-muted">{item.hint}</p>
            </Card>
          );
        })}
      </section>

      <ProjectSection title="Мои проекты" projects={dashboard.my_projects} empty="Вы пока не создали ни одного проекта." />

      <ProjectSection title="Я участвую" projects={dashboard.joined_projects} empty="Вы пока не участвуете ни в одном проекте." />

      <ProjectSection
        title="Рекомендуемые проекты"
        projects={dashboard.recommended_projects}
        empty="Подберите навыки в профиле, и здесь появятся проекты с совпадающим стеком."
        action={
          <Link href="/projects" className="text-sm font-semibold text-brand">
            Все проекты
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Мои заявки</h2>
          <div className="grid gap-3">
            {dashboard.my_applications.slice(0, 4).map((app) => (
              <Link
                key={app.id}
                href={`/projects/${app.project_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm transition hover:bg-surface"
              >
                <span className="font-semibold">{app.project.title}</span>
                <Badge tone={statusTone(app.status)}>{statusLabel(app.status)}</Badge>
              </Link>
            ))}
            {!dashboard.my_applications.length ? <p className="text-sm text-muted">Вы еще не отправляли заявки.</p> : null}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 font-bold">
            <Bell size={17} />
            Уведомления
          </div>
          <div className="grid gap-3">
            {dashboard.notifications.length ? (
              dashboard.notifications.slice(0, 5).map((notification) => (
                <Link
                  href={notification.link || "/dashboard"}
                  key={notification.id}
                  className="rounded-lg border border-border p-3 text-sm transition hover:bg-surface"
                >
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-muted">{notification.body}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">Новых уведомлений нет.</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-bold">Последняя активность</h2>
          <div className="grid gap-3">
            {dashboard.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={`${activity.type}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="line-clamp-1">{activity.title}</span>
                <span className="shrink-0 text-xs text-muted">{formatDate(activity.created_at)}</span>
              </div>
            ))}
            {!dashboard.recent_activity.length ? <p className="text-sm text-muted">Активность появится после действий.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ProjectSection({
  title,
  projects,
  empty,
  action
}: {
  title: string;
  projects: Project[];
  empty: string;
  action?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        {action}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.length ? (
          projects.slice(0, 6).map((project) => <ProjectCard key={project.id} project={project} compact />)
        ) : (
          <Card className="p-6 text-sm text-muted sm:col-span-2 xl:col-span-3">{empty}</Card>
        )}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-8">
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
