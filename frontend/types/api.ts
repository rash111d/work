export type Skill = {
  id: number;
  name: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  university: string;
  course: number;
  city: string;
  rating: number;
  skills: Skill[];
  created_at: string;
  updated_at: string;
};

export type ProjectStatus = "open" | "in_progress" | "completed" | "archived";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type ProjectMember = {
  id: number;
  project_id: number;
  user_id: number;
  role: "creator" | "member";
  user: User;
  created_at: string;
};

export type Project = {
  id: number;
  owner_id: number;
  owner: User;
  title: string;
  description: string;
  format: string;
  deadline: string;
  status: ProjectStatus;
  capacity: number;
  stack: Skill[];
  members: ProjectMember[];
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: number;
  project_id: number;
  user_id: number;
  status: ApplicationStatus;
  message: string;
  project: Project;
  user: User;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  project_id: number;
  user_id: number;
  content: string;
  user: User;
  created_at: string;
};

export type Notification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
};

export type ActivityItem = {
  type: string;
  title: string;
  created_at: string;
};

export type Dashboard = {
  stats: {
    projects: number;
    pending_applications: number;
    accepted_applications: number;
    rejected_applications: number;
    notifications: number;
  };
  my_projects: Project[];
  joined_projects: Project[];
  my_applications: Application[];
  recommended_projects: Project[];
  notifications: Notification[];
  recent_activity: ActivityItem[];
};

export type Paginated<T> = {
  items: T[];
  total: number;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export type ProjectPayload = {
  title: string;
  description: string;
  format: string;
  deadline: string;
  status: ProjectStatus;
  capacity: number;
  stack: string[];
};
