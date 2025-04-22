"use client";
import {  useState } from "react";
import { Collapse, Checkbox, Button, Input, Spin, Empty, Form, Typography} from "antd";

import DistanceToNow from "../utils/DistanceToNow";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import listTodosAction from '@/app/actions/todos/listTodosAction';
import createTodoAction from '@/app/actions/todos/createTodoAction';
import { TodoTasks } from "./TodoTasks";

interface Todo {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
}

interface RawTodo {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export default function TaskPanel({ serverId }: { serverId: number }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPublic, setNewTaskPublic] = useState(false);
  const [expanded, setExpanded] = useState<string | string[]>([]);
  const queryClient = useQueryClient();

  // Fetch todos using TanStack Query
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Todo[]>({
    queryKey: ['tasks', serverId],
    queryFn: async () => {
      const raw = await listTodosAction(serverId);
      return raw.map((t: RawTodo) => ({
        ...t,
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toString() ?? '',
        updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : t.updatedAt?.toString() ?? '',
      })) as Todo[];
    },
  });
  const createTodoMutation = useMutation({
    mutationFn: async (payload: { title: string; isPublic: boolean }) =>
      await createTodoAction(serverId, payload.title, payload.isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', serverId] });
    },
  });

  const handleCreateTodo = async () => {
    if (!newTaskTitle.trim()) return;
    createTodoMutation.mutate({ title: newTaskTitle, isPublic: newTaskPublic });
    setNewTaskTitle("");
    setNewTaskPublic(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-black/10">
      <Form layout="inline" onFinish={handleCreateTodo} style={{ marginBottom: 20, gap: 8 }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            placeholder="New task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ minWidth: 180 }}
            size="small"
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Checkbox checked={newTaskPublic} onChange={(e) => setNewTaskPublic(e.target.checked)}>
            Public
          </Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={createTodoMutation.isPending} size="small">
            Add Task
          </Button>
        </Form.Item>
      </Form>
      {loadingTasks ? (
        <Spin />
      ) : tasks.length === 0 ? (
        <Empty description="No tasks yet" />
      ) : (
        <Collapse
          accordion
          activeKey={expanded}
          onChange={setExpanded}
          style={{ background: 'none' }}
          items={tasks.map((todo) => ({
            key: todo.id.toString(),
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Typography.Text strong>{todo.title}</Typography.Text>
                {todo.isPublic ? <Typography.Text type="secondary">Public</Typography.Text> : <Typography.Text type="secondary">Private</Typography.Text>}
                <DistanceToNow date={new Date(todo.createdAt)} />
              </div>
            ),
            children: <TodoTasks todoId={todo.id} />,
            style: { marginBottom: 16, background: '#18181b', borderRadius: 8, border: '1px solid #232326', padding: 12 },
          }))}
        />
      )}
    </div>
  );
}
