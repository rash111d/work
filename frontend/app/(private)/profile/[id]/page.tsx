"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, Skeleton } from "@/components/ui/card";
import { api } from "@/services/api";
import type { User } from "@/types/api";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    api.user(Number(params.id)).then(setProfile);
  }, [params.id]);

  if (!profile) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid gap-6 animate-in">
      <Card className="p-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_240px]">
          <div className="flex justify-center">
            <Avatar name={profile.name} src={profile.avatar_url} size={132} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="mt-1 text-muted">
              Студент {profile.course} курс, {profile.university}
            </p>
            <div className="mt-6">
              <h2 className="font-bold">О себе</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{profile.bio || "Описание пока не заполнено."}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill.id} tone="brand">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Info label="Email" value={profile.email} />
            <Info label="Курс" value={`${profile.course}`} />
            <Info label="Университет" value={profile.university || "Не указан"} />
            <Info label="Город" value={profile.city || "Не указан"} />
            <Info label="Рейтинг" value={profile.rating.toFixed(1)} />
          </div>
        </div>
      </Card>
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
