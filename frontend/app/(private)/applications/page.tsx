"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Application, ApplicationStatus } from "@/types/api";
import { formatDate, statusLabel, statusTone } from "@/utils/format";

const statusFilters: Array<"all" | ApplicationStatus> = ["all", "pending", "accepted", "rejected"];

export default function ApplicationsPage() {
  const [mode, setMode] = useState<"mine" | "incoming">("mine");
  const [status, setStatus] = useState<"all" | ApplicationStatus>("all");
  const [mine, setMine] = useState<Application[] | null>(null);
  const [incoming, setIncoming] = useState<Application[] | null>(null);

  const load = () => {
    Promise.all([api.applicationsMine(), api.applicationsIncoming()]).then(([mineResult, incomingResult]) => {
      setMine(mineResult);
      setIncoming(incomingResult);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const apps = mode === "mine" ? mine : incoming;
  const filtered = useMemo(() => {
    if (!apps) return null;
    if (status === "all") return apps;
    return apps.filter((app) => app.status === status);
  }, [apps, status]);

  const changeStatus = async (id: number, next: ApplicationStatus) => {
    await api.changeApplicationStatus(id, next);
    load();
  };

  return (
    <div className="grid gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">Мои заявки</h1>
        <p className="mt-1 text-sm text-muted">Статусы заявок и входящие запросы в ваши проекты.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "mine" ? "primary" : "secondary"} onClick={() => setMode("mine")}>
          Отправленные
        </Button>
        <Button variant={mode === "incoming" ? "primary" : "secondary"} onClick={() => setMode("incoming")}>
          Входящие
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border">
        {statusFilters.map((item) => (
          <button
            key={item}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              status === item ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            }`}
            onClick={() => setStatus(item)}
          >
            {item === "all" ? "Все" : statusLabel(item)}
          </button>
        ))}
      </div>

      {!filtered ? (
        <Skeleton className="h-96" />
      ) : filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((app) => (
            <Card key={app.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <div>
                <Link href={`/projects/${app.project_id}`} className="text-lg font-bold hover:text-brand">
                  {app.project.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {app.project.stack.slice(0, 4).map((skill) => (
                    <Badge key={skill.id} tone="brand">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
                {mode === "incoming" ? (
                  <Link href={`/profile/${app.user_id}`} className="mt-3 flex items-center gap-2 text-sm text-muted hover:text-ink">
                    <Avatar name={app.user.name} src={app.user.avatar_url} size={28} />
                    {app.user.name}
                  </Link>
                ) : null}
              </div>
              <div className="text-sm text-muted">Подано {formatDate(app.created_at)}</div>
              <div className="flex items-center gap-2 lg:justify-end">
                <Badge tone={statusTone(app.status)}>{statusLabel(app.status)}</Badge>
                {mode === "incoming" && app.status === "pending" ? (
                  <>
                    <Button variant="secondary" onClick={() => changeStatus(app.id, "accepted")}>
                      <Check size={16} />
                      Принять
                    </Button>
                    <Button variant="danger" onClick={() => changeStatus(app.id, "rejected")}>
                      <X size={16} />
                      Отклонить
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Заявок с этим статусом нет.</Card>
      )}
    </div>
  );
}
