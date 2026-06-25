"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, Skeleton } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/services/api";
import type { Paginated, Skill, User } from "@/types/api";

export default function TeammatesPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    skill: "",
    course: "",
    university: "",
    minRating: "",
    sort: "rating"
  });

  const params = useMemo(() => {
    const next = new URLSearchParams();
    if (filters.search) next.set("search", filters.search);
    if (filters.skill) next.set("skills", filters.skill);
    if (filters.course) next.set("course", filters.course);
    if (filters.university) next.set("university", filters.university);
    if (filters.minRating) next.set("min_rating", filters.minRating);
    if (filters.sort) next.set("sort", filters.sort);
    return next;
  }, [filters]);

  useEffect(() => {
    api.skills().then(setSkills);
  }, []);

  useEffect(() => {
    api.users(params).then(setData);
  }, [params]);

  return (
    <div className="grid gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">Тиммейты</h1>
        <p className="mt-1 text-sm text-muted">Поиск студентов по навыкам, курсу, университету и рейтингу.</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_170px_140px_170px_140px]">
          <Field label="Поиск">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <Input
                className="pl-9"
                value={filters.search}
                placeholder="Имя или email"
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
            </div>
          </Field>
          <Field label="Навык">
            <Select value={filters.skill} onChange={(event) => setFilters((prev) => ({ ...prev, skill: event.target.value }))}>
              <option value="">Любой</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Курс">
            <Select value={filters.course} onChange={(event) => setFilters((prev) => ({ ...prev, course: event.target.value }))}>
              <option value="">Любой</option>
              {[1, 2, 3, 4, 5, 6].map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Университет">
            <Input
              value={filters.university}
              onChange={(event) => setFilters((prev) => ({ ...prev, university: event.target.value }))}
            />
          </Field>
          <Field label="Рейтинг">
            <Select
              value={filters.minRating}
              onChange={(event) => setFilters((prev) => ({ ...prev, minRating: event.target.value }))}
            >
              <option value="">Любой</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </Select>
          </Field>
        </div>
      </Card>

      {!data ? (
        <Skeleton className="h-80" />
      ) : data.items.length ? (
        <div className="grid gap-3">
          {data.items.map((member) => (
            <Link
              href={`/profile/${member.id}`}
              key={member.id}
              className="grid gap-3 rounded-lg border border-border bg-panel p-4 transition hover:-translate-y-0.5 hover:shadow-soft sm:grid-cols-[1fr_auto]"
            >
              <div className="flex items-center gap-3">
                <Avatar name={member.name} src={member.avatar_url} size={48} />
                <div>
                  <p className="font-bold">{member.name}</p>
                  <p className="text-sm text-muted">
                    {member.course} курс, {member.university || "университет не указан"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill.id} tone="brand">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <span className="text-sm font-bold">{member.rating.toFixed(1)}</span>
                <Heart size={18} className="text-muted" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Пользователи по этим фильтрам не найдены.</Card>
      )}
    </div>
  );
}
