"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectForm } from "@/components/forms/project-form";
import { Card, Skeleton } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Project, ProjectPayload } from "@/types/api";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectID = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    api.project(projectID).then(setProject);
  }, [projectID]);

  const submit = async (payload: ProjectPayload) => {
    const updated = await api.updateProject(projectID, payload);
    router.replace(`/projects/${updated.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl animate-in">
      <h1 className="text-2xl font-bold">Редактировать проект</h1>
      <Card className="mt-6 p-5">
        {project ? <ProjectForm project={project} submitLabel="Сохранить изменения" onSubmit={submit} /> : <Skeleton className="h-96" />}
      </Card>
    </div>
  );
}
