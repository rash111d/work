"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/services/api";
import type { Paginated, Project, Skill } from "@/types/api";

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [data, setData] = useState<Paginated<Project> | null>(null);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") ?? "",
    stack: "",
    status: "",
    sort: "updated"
  });
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const next = new URLSearchParams();
    if (filters.search) next.set("search", filters.search);
    if (filters.stack) next.set("stack", filters.stack);
    if (filters.status) next.set("status", filters.status);
    if (filters.sort) next.set("sort", filters.sort);
    return next;
  }, [filters]);

  useEffect(() => {
    api.skills().then(setSkills).catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.projects(params).then(setData).finally(() => setLoading(false));
  }, [params]);

  return (
    <div className="grid gap-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Найдено {data?.total ?? 0} проектов</h1>
          <p className="mt-1 text-sm text-muted">Проекты доступны по названию, стеку, статусу и дедлайну.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus size={16} />
            Создать проект
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_180px_180px]">
          <Field label="Поиск">
            <Input
              value={filters.search}
              placeholder="Название или описание"
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </Field>
          <Field label="Технология">
            <Select value={filters.stack} onChange={(event) => setFilters((prev) => ({ ...prev, stack: event.target.value }))}>
              <option value="">Любая</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Статус">
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">Любой</option>
              <option value="open">Открыт</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Завершен</option>
            </Select>
          </Field>
          <Field label="Сортировка">
            <Select value={filters.sort} onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}>
              <option value="updated">Сначала новые</option>
              <option value="deadline">По дедлайну</option>
              <option value="status">По статусу</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted md:hidden">
          <SlidersHorizontal size={14} />
          Фильтры применяются автоматически
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : data?.items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Проекты по этим фильтрам не найдены.</Card>
      )}
    </div>
  );
}
