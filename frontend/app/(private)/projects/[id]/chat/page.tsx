"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChatRoom } from "@/components/chat/chat-room";

export default function ProjectChatPage() {
  const params = useParams<{ id: string }>();
  const projectID = Number(params.id);

  return (
    <div className="grid gap-4 animate-in">
      <Link href={`/projects/${projectID}`} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} />
        Назад к проекту
      </Link>
      <ChatRoom projectID={projectID} />
    </div>
  );
}
