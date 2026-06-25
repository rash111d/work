"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProjectForm } from "@/components/forms/project-form";
import { api } from "@/services/api";
import type { ProjectPayload } from "@/types/api";

export default function NewProjectPage() {
  const router = useRouter();
  const submit = async (payload: ProjectPayload) => {
    const project = await api.createProject(payload);
    router.replace(`/projects/${project.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl animate-in">
      <h1 className="text-2xl font-bold">Создать проект</h1>
      <Card className="mt-6 p-5">
        <ProjectForm submitLabel="Создать проект" onSubmit={submit} />
      </Card>
    </div>
  );
}
