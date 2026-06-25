"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
  ClipboardList
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Проекты", icon: FolderKanban },
  { href: "/teammates", label: "Тиммейты", icon: Users },
  { href: "/applications", label: "Мои заявки", icon: ClipboardList },
  { href: "/messages", label: "Сообщение", icon: MessageCircle },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function PrivateShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Загрузка...</div>;
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-panel md:flex md:flex-col">
        <Link href="/dashboard" className="px-8 pt-12 text-base font-bold">
          EduMatch
        </Link>
        <nav className="mt-8 grid gap-1 px-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                  active ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut size={16} />
            Выйти
          </Button>
        </div>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-panel/95 px-4 backdrop-blur md:px-8">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-muted">
            <Search size={17} />
            <input
              className="w-full bg-transparent text-sm text-ink outline-none"
              placeholder="Поиск проектов, навыков, пользователей"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  const value = event.currentTarget.value.trim();
                  if (value) {
                    router.push(`/projects?search=${encodeURIComponent(value)}`);
                  }
                }
              }}
            />
          </div>
          <div className="ml-4 flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-ink sm:flex"
              title="Уведомления"
            >
              <Bell size={18} />
            </Link>
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar name={user.name} src={user.avatar_url} size={36} />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-panel p-2 md:hidden">
        {nav.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold transition",
                active ? "bg-brand/10 text-brand" : "text-muted"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
