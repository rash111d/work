"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, WS_URL } from "@/services/api";
import type { Message, Project } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";

type SocketPayload = {
  type: "message" | "error";
  message: Message | string;
};

export function ChatRoom({ projectID }: { projectID: number }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Подключение...");
  const socketRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([api.project(projectID), api.messages(projectID)]).then(([projectResult, messageResult]) => {
      setProject(projectResult);
      setMessages(messageResult);
    });
  }, [projectID]);

  useEffect(() => {
    const token = api.getAccessToken();
    if (!token) return;
    const socket = new WebSocket(`${WS_URL}/projects/${projectID}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;
    socket.onopen = () => setStatus("Online");
    socket.onclose = () => setStatus("Отключено");
    socket.onerror = () => setStatus("Ошибка соединения");
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as SocketPayload;
      if (payload.type === "message" && typeof payload.message !== "string") {
        const incoming = payload.message;
        setMessages((prev) => {
          if (prev.some((item) => item.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
      }
      if (payload.type === "error" && typeof payload.message === "string") {
        setStatus(payload.message);
      }
    };
    return () => socket.close();
  }, [projectID]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = content.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    socketRef.current.send(JSON.stringify({ content: text }));
    setContent("");
  };

  if (!project) {
    return <Skeleton className="h-[620px]" />;
  }

  return (
    <Card className="grid h-[calc(100vh-150px)] min-h-[560px] grid-rows-[auto_1fr_auto] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h1 className="text-lg font-bold">{project.title}</h1>
          <p className="text-sm text-muted">{status}</p>
        </div>
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((member) => (
            <Avatar key={member.id} name={member.user.name} src={member.user.avatar_url} size={34} />
          ))}
        </div>
      </div>
      <div className="overflow-y-auto bg-surface/40 p-4">
        <div className="mx-auto grid max-w-3xl gap-3">
          {messages.map((message) => {
            const mine = message.user_id === user?.id;
            return (
              <div key={message.id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine ? <Avatar name={message.user.name} src={message.user.avatar_url} size={34} /> : null}
                <div className={`max-w-[78%] rounded-lg border border-border bg-panel p-3 ${mine ? "bg-brand text-white" : ""}`}>
                  <p className={`text-xs font-semibold ${mine ? "text-white/80" : "text-muted"}`}>{message.user.name}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                </div>
              </div>
            );
          })}
          {!messages.length ? <p className="py-10 text-center text-sm text-muted">Сообщений пока нет.</p> : null}
          <div ref={endRef} />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <Input
          value={content}
          placeholder="Напишите сообщение"
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send}>
          <Send size={16} />
          Отправить
        </Button>
      </div>
    </Card>
  );
}
