import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import type { Project } from "@/types/api";
import { formatDate, statusLabel, statusTone } from "@/utils/format";

export function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  return (
    <Card className="group p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/projects/${project.id}`} className="grid gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.stack.slice(0, compact ? 3 : 5).map((skill) => (
            <Badge key={skill.id} tone="brand">
              {skill.name}
            </Badge>
          ))}
          <Badge tone={statusTone(project.status)}>{statusLabel(project.status)}</Badge>
        </div>
        <div>
          <h3 className="text-lg font-bold transition group-hover:text-brand">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Avatar name={project.owner?.name ?? "User"} src={project.owner?.avatar_url} size={28} />
            <span>{project.owner?.name ?? "Организатор"}</span>
          </div>
          <span>Дедлайн: {formatDate(project.deadline)}</span>
        </div>
      </Link>
    </Card>
  );
}
