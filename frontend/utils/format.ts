import type { ApplicationStatus, ProjectStatus, Skill } from "@/types/api";

export function formatDate(value: string) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function statusLabel(status: ProjectStatus | ApplicationStatus) {
  const labels: Record<string, string> = {
    open: "Открыт",
    in_progress: "В работе",
    completed: "Завершен",
    archived: "Архив",
    pending: "На рассмотрении",
    accepted: "Принято",
    rejected: "Отклонено"
  };
  return labels[status] ?? status;
}

export function statusTone(status: ProjectStatus | ApplicationStatus) {
  if (status === "accepted" || status === "completed") {
    return "success";
  }
  if (status === "rejected" || status === "archived") {
    return "danger";
  }
  if (status === "pending" || status === "in_progress") {
    return "warning";
  }
  return "neutral";
}

export function names(skills: Skill[] = []) {
  return skills.map((skill) => skill.name);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
