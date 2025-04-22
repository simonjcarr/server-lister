import assignTaskAction from "@/app/actions/todos/assignTaskAction";
import listTasksAction from "@/app/actions/todos/listTasksAction";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, List, message, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import { CheckCircleFilled } from "@ant-design/icons";
import { TaskComments } from "./TaskComments";

interface RawTask {
  id: number;
  todoId: number;
  title: string;
  isComplete: boolean;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Task {
  id: number;
  title: string;
  isComplete: boolean;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
}

export function TodoTasks({ todoId }: { todoId: number }) {
  const [selectedAssignees, setSelectedAssignees] = useState<{ [taskId: number]: string | undefined }>({});
  const [assignLoading, setAssignLoading] = useState<{ [taskId: number]: boolean }>({});
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch tasks using tanstack query
  const { data: tasks = [], isLoading: loading } = useQuery<Task[]>({
    queryKey: ['tasks', todoId],
    queryFn: async () => {
      const raw = await listTasksAction(todoId);
      if (!raw) return [];
      return raw.map((t: RawTask) => ({
        id: t.id,
        title: t.title,
        isComplete: t.isComplete,
        assignedTo: t.assignedTo ?? undefined,
        assignedToName: t.assignedToName ?? undefined,
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toString() ?? '',
        updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : t.updatedAt?.toString() ?? '',
      })) as Task[];
    },
  });

  // Fetch users using tanstack query
  const { data: users = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    },
  });

  // Assign mutation using server action
  const assignMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: number, userId: string }) => {
      return await assignTaskAction(taskId, userId);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', todoId] });
      setSelectedAssignees((prev) => ({ ...prev, [taskId]: undefined }));
      messageApi.success('Task assigned!');
    },
    onSettled: (_, __, { taskId }) => {
      setAssignLoading((prev) => ({ ...prev, [taskId]: false }));
    },
  });

  const handleAssignChange = (taskId: number, userId: string | undefined) => {
    setSelectedAssignees((prev) => ({ ...prev, [taskId]: userId }));
  };

  const handleAssignTask = (taskId: number) => {
    const userId = selectedAssignees[taskId];
    if (!userId) return;
    setAssignLoading((prev) => ({ ...prev, [taskId]: true }));
    assignMutation.mutate({ taskId, userId });
  };

  const handleAddTask = async () => {
    const newTaskTitle = prompt("Enter new task title");
    if (!newTaskTitle) return;
    const res = await fetch("/api/todos/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoId, title: newTaskTitle }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['tasks', todoId] });
    }
  };

  const handleToggleTask = async (task: Task) => {
    const res = await fetch("/api/todos/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, isComplete: !task.isComplete }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['tasks', todoId] });
    }
  };

  useEffect(() => {
    setSelectedAssignees({});
  }, [tasks]);

  useEffect(() => {
    if (!tasks) return;
    setSelectedAssignees((prev) => {
      const updated = { ...prev };
      tasks.forEach(task => {
        if (prev[task.id] !== undefined && prev[task.id] === task.assignedTo) {
          delete updated[task.id];
        }
      });
      return updated;
    });
  }, [tasks]);

  return (
    <div style={{ padding: 8, background: '#232326', borderRadius: 6 }}>
      {contextHolder}
      <Form layout="inline" onFinish={handleAddTask} style={{ marginBottom: 14, gap: 8 }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            placeholder="New task"
            style={{ minWidth: 140 }}
            size="small"
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} size="small">
            Add Task
          </Button>
        </Form.Item>
      </Form>
      <List
        dataSource={tasks}
        renderItem={(task) => (
          <>
            <List.Item
              style={{
                alignItems: 'flex-start',
                padding: 0,
                border: 'none',
                marginBottom: 10,
                background: task.isComplete ? 'linear-gradient(90deg,#e0fbe7 60%,#c6f7e2 100%)' : 'transparent',
                borderRadius: 4,
                transition: 'background 0.2s',
                boxShadow: task.isComplete ? '0 1px 6px 0 rgba(34,197,94,0.10)' : undefined,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {task.isComplete ? (
                    <CheckCircleFilled
                      style={{ fontSize: 18, color: '#22c55e', cursor: 'pointer' }}
                      title="Mark as incomplete"
                      onClick={() => handleToggleTask(task)}
                    />
                  ) : (
                    <Checkbox checked={false} onChange={() => handleToggleTask(task)} />
                  )}
                  <Typography.Text
                    style={{
                      fontSize: 15,
                      color: task.isComplete ? '#15803d' : undefined,
                      fontWeight: task.isComplete ? 600 : 400,
                      background: task.isComplete ? 'rgba(34,197,94,0.10)' : undefined,
                      padding: task.isComplete ? '1px 6px' : undefined,
                      borderRadius: 4,
                      transition: 'all 0.2s',
                    }}
                  >
                    {task.title}
                  </Typography.Text>
                </div>
                <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select
                    size="small"
                    style={{ minWidth: 120 }}
                    placeholder={task.assignedToName ? `Assigned: ${task.assignedToName}` : 'Assign user'}
                    value={selectedAssignees[task.id] ?? task.assignedTo ?? undefined}
                    onChange={(userId) => handleAssignChange(task.id, userId)}
                    options={users.map((u) => ({ value: u.id, label: u.name || u.id }))}
                    allowClear
                  />
                  {(() => {
                    const assignValue = selectedAssignees[task.id] ?? task.assignedTo;
                    console.log('Task ID:', task.id, 'selectedAssignees:', selectedAssignees[task.id], 'assignedTo:', task.assignedTo, 'assignValue:', assignValue);
                    return null;
                  })()}
                  <Button
                    size="small"
                    type="primary"
                    loading={assignLoading[task.id]}
                    disabled={
                      !((selectedAssignees[task.id] ?? task.assignedTo)) ||
                      (selectedAssignees[task.id] ?? task.assignedTo) === task.assignedTo
                    }
                    onClick={() => handleAssignTask(task.id)}
                  >
                    Assign
                  </Button>
                </div>
                <TaskComments taskId={task.id} completed={task.isComplete} />
              </div>
            </List.Item>
            {tasks.indexOf(task) < tasks.length - 1 && (
              <div style={{ borderBottom: '1.5px dotted #444', margin: '8px 0' }} />
            )}
          </>
        )}
        style={{ marginBottom: 0 }}
      />
    </div>
  );
}