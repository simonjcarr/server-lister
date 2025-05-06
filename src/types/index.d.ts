import type { User } from "@/db/schema"
  

export type ServerTask = {
  id: number;
  title: string;
  assignedTo: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  key: number;
  description: string | null;
  taskCount: number;
  taskCompleteCount: number;
  taskNotCompleteCount: number;
  isPublic: boolean;
};

export type SubTask = {
  id: number;
  title: string;
  description?: string | null;
  taskId: number;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  key: number;
  isComplete: boolean;
} & User;

export type SubTaskComment = {
  id: number;
  subTaskId: number;
  userId: string;
  comment: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }
};

