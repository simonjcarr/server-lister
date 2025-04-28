export type ServerAction = {
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

export type Task = {
  id: number;
  title: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  key: number;
  isComplete: boolean;
};

