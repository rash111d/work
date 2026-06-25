import type {
  Application,
  ApplicationStatus,
  AuthResponse,
  Dashboard,
  Message,
  Notification,
  Paginated,
  Project,
  ProjectPayload,
  Skill,
  User
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

const ACCESS_KEY = "edumatch.access";
const REFRESH_KEY = "edumatch.refresh";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = window.localStorage.getItem(ACCESS_KEY);
      this.refreshToken = window.localStorage.getItem(REFRESH_KEY);
    }
  }

  hasSession() {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(window.localStorage.getItem(ACCESS_KEY) && window.localStorage.getItem(REFRESH_KEY));
  }

  getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (typeof window !== "undefined") {
      this.accessToken = window.localStorage.getItem(ACCESS_KEY);
    }
    return this.accessToken;
  }

  private getRefreshToken() {
    if (this.refreshToken) {
      return this.refreshToken;
    }
    if (typeof window !== "undefined") {
      this.refreshToken = window.localStorage.getItem(REFRESH_KEY);
    }
    return this.refreshToken;
  }

  saveSession(response: AuthResponse) {
    this.accessToken = response.access_token;
    this.refreshToken = response.refresh_token;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, response.access_token);
      window.localStorage.setItem(REFRESH_KEY, response.refresh_token);
    }
  }

  clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
  }

  async request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;
    if (!isFormData && options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (options.auth !== false) {
      const token = this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 && retry && options.auth !== false && this.getRefreshToken()) {
      await this.refresh();
      return this.request<T>(path, options, false);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? "Ошибка запроса");
    }
    return data as T;
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    university: string;
    course: number;
    skills: string[];
  }) {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false
    });
    this.saveSession(response);
    return response;
  }

  async login(input: { email: string; password: string }) {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false
    });
    this.saveSession(response);
    return response;
  }

  async refresh() {
    if (!this.refreshPromise) {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.clearSession();
        throw new Error("Сессия истекла");
      }
      this.refreshPromise = this.request<AuthResponse>(
        "/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
          auth: false
        },
        false
      )
        .then((response) => {
          this.saveSession(response);
          return response;
        })
        .catch((error) => {
          this.clearSession();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.request<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
        auth: false
      }).catch(() => undefined);
    }
    this.clearSession();
  }

  me() {
    return this.request<User>("/users/me");
  }

  updateMe(input: {
    name: string;
    bio: string;
    university: string;
    course: number;
    city: string;
    skills: string[];
  }) {
    return this.request<User>("/users/me", { method: "PUT", body: JSON.stringify(input) });
  }

  uploadAvatar(file: File) {
    const body = new FormData();
    body.append("avatar", file);
    return this.request<User>("/users/me/avatar", { method: "POST", body });
  }

  skills() {
    return this.request<Skill[]>("/skills", { auth: false });
  }

  users(params: URLSearchParams) {
    return this.request<Paginated<User>>(`/users?${params.toString()}`);
  }

  user(id: number) {
    return this.request<User>(`/users/${id}`);
  }

  dashboard() {
    return this.request<Dashboard>("/dashboard");
  }

  projects(params = new URLSearchParams()) {
    const query = params.toString();
    return this.request<Paginated<Project>>(`/projects${query ? `?${query}` : ""}`);
  }

  myProjects() {
    return this.request<Project[]>("/projects/mine");
  }

  recommendedProjects() {
    return this.request<Project[]>("/projects/recommended");
  }

  project(id: number) {
    return this.request<Project>(`/projects/${id}`);
  }

  createProject(input: ProjectPayload) {
    return this.request<Project>("/projects", { method: "POST", body: JSON.stringify(input) });
  }

  updateProject(id: number, input: ProjectPayload) {
    return this.request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(input) });
  }

  deleteProject(id: number) {
    return this.request<void>(`/projects/${id}`, { method: "DELETE" });
  }

  apply(projectId: number, message: string) {
    return this.request<Application>(`/projects/${projectId}/applications`, {
      method: "POST",
      body: JSON.stringify({ message })
    });
  }

  messages(projectId: number) {
    return this.request<Message[]>(`/projects/${projectId}/messages?limit=100`);
  }

  applicationsMine() {
    return this.request<Application[]>("/applications/mine");
  }

  applicationsIncoming() {
    return this.request<Application[]>("/applications/incoming");
  }

  changeApplicationStatus(id: number, status: ApplicationStatus) {
    return this.request<Application>(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  notifications() {
    return this.request<Notification[]>("/notifications");
  }

  markNotificationRead(id: number) {
    return this.request<void>(`/notifications/${id}/read`, { method: "PATCH" });
  }

  markAllNotificationsRead() {
    return this.request<void>("/notifications/read-all", { method: "PATCH" });
  }
}

export const api = new ApiClient();
