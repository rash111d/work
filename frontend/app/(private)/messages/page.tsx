"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Project } from "@/types/api";
import { formatDate } from "@/utils/format";

export default function MessagesPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.myProjects().then(setProjects);
  }, []);

  if (!projects) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">Сообщение</h1>
        <p className="mt-1 text-sm text-muted">Чаты доступны в проектах, где вы состоите в команде.</p>
      </div>
      <div className="grid gap-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} name={member.user.name} src={member.user.avatar_url} size={36} />
                ))}
              </div>
              <div>
                <p className="font-bold">{project.title}</p>
                <p className="text-sm text-muted">Дедлайн: {formatDate(project.deadline)}</p>
              </div>
            </div>
            <Link href={`/projects/${project.id}/chat`}>
              <Button variant="secondary">
                <MessageCircle size={16} />
                Открыть чат
              </Button>
            </Link>
          </Card>
        ))}
        {!projects.length ? <Card className="p-8 text-center text-sm text-muted">У вас пока нет проектных чатов.</Card> : null}
      </div>
    </div>
  );
}
