"use client";
import { useEffect, useState } from "react";
import { Collapse, Checkbox, Button, Input, Spin, Empty, Form, List, Typography, Space, Select, message } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import DistanceToNow from "../utils/DistanceToNow";
import { getAllUsers } from "@/app/actions/users/userActions";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import assignTaskAction from '@/app/actions/todos/assignTaskAction';
import listTasksAction from '@/app/actions/todos/listTasksAction';
import listTodosAction from '@/app/actions/todos/listTodosAction';
import createTodoAction from '@/app/actions/todos/createTodoAction';
import listTaskCommentsAction from '@/app/actions/todos/listTaskCommentsAction';
import addTaskCommentAction from '@/app/actions/todos/addTaskCommentAction';

interface Todo {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
}
interface Task {
  id: number;
  title: string;
  isComplete: boolean;
  assignedTo?: string;
  assignedToName?: string;
}
interface Comment {
  id: number;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export default function TodoPanel({ serverId }: { serverId: number }) {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoPublic, setNewTodoPublic] = useState(false);
  const [expanded, setExpanded] = useState<string | string[]>([]);
  const queryClient = useQueryClient();

  // Fetch todos using TanStack Query
  const { data: todos = [], isLoading: loadingTodos } = useQuery<Todo[]>({
    queryKey: ['todos', serverId],
    queryFn: async () => {
      const raw = await listTodosAction(serverId);
      return raw.map((t: any) => ({
        ...t,
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : t.createdAt?.toString() ?? '',
        updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : t.updatedAt?.toString() ?? '',
      })) as Todo[];
    },
  });
  const createTodoMutation = useMutation({
    mutationFn: async (payload: { title: string; isPublic: boolean }) =>
      await createTodoAction(serverId, payload.title, payload.isPublic),
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: ['todos', serverId] });
    },
  });

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) return;
    createTodoMutation.mutate({ title: newTodoTitle, isPublic: newTodoPublic });
    setNewTodoTitle("");
    setNewTodoPublic(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-black/10">
      <Form layout="inline" onFinish={handleCreateTodo} style={{ marginBottom: 20, gap: 8 }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            placeholder="New todo title"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            style={{ minWidth: 180 }}
            size="small"
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Checkbox checked={newTodoPublic} onChange={(e) => setNewTodoPublic(e.target.checked)}>
            Public
          </Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={createTodoMutation.isLoading} size="small">
            Add Todo
          </Button>
        </Form.Item>
      </Form>
      {loadingTodos ? (
        <Spin />
      ) : todos.length === 0 ? (
        <Empty description="No todos yet" />
      ) : (
        <Collapse
          accordion
          activeKey={expanded}
          onChange={setExpanded}
          style={{ background: 'none' }}
          items={todos.map((todo) => ({
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

function TodoTasks({ todoId }: { todoId: number }) {
  const [selectedAssignees, setSelectedAssignees] = useState<{ [taskId: number]: string | undefined }>({});
  const [assignLoading, setAssignLoading] = useState<{ [taskId: number]: boolean }>({});
  const queryClient = useQueryClient();

  // Fetch tasks using tanstack query
  const { data: tasks = [], isLoading: loading } = useQuery<Task[]>({
    queryKey: ['tasks', todoId],
    queryFn: async () => {
      const raw = await listTasksAction(todoId);
      return raw.map((t: any) => ({
        ...t,
        assignedTo: t.assignedTo ?? undefined,
        assignedToName: t.assignedToName ?? undefined,
        createdAt: t.createdAt ? t.createdAt.toString() : '',
        updatedAt: t.updatedAt ? t.updatedAt.toString() : '',
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
    onSuccess: (_, { taskId, userId }) => {
      queryClient.invalidateQueries(['tasks', todoId]);
      setSelectedAssignees((prev) => ({ ...prev, [taskId]: undefined }));
      message.success('Task assigned!');
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
      queryClient.invalidateQueries(['tasks', todoId]);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const res = await fetch("/api/todos/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, isComplete: !task.isComplete }),
    });
    if (res.ok) {
      queryClient.invalidateQueries(['tasks', todoId]);
    }
  };

  return (
    <div style={{ padding: 8, background: '#232326', borderRadius: 6 }}>
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
                  <Button
                    size="small"
                    type="primary"
                    loading={assignLoading[task.id]}
                    disabled={!selectedAssignees[task.id] || selectedAssignees[task.id] === task.assignedTo}
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

function TaskComments({ taskId, completed = false }: { taskId: number, completed?: boolean }) {
  const [newComment, setNewComment] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments using server action, mapping nulls and Dates to correct types
  const { data: comments = [], isLoading: loadingComments } = useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const raw = await listTaskCommentsAction(taskId);
      return raw.map((c: any) => ({
        ...c,
        userName: c.userName ?? '',
        createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt?.toString() ?? '',
      })) as Comment[];
    }
  });

  // Add comment mutation using server action
  const addCommentMutation = useMutation({
    mutationFn: async (payload: { taskId: number, comment: string }) =>
      await addTaskCommentAction(payload.taskId, payload.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment("");
      setOpen(true);
    },
  });

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ taskId, comment: newComment });
  };

  const commentButtonStyle = completed
    ? { backgroundColor: '#e0e0e0', color: '#888', border: 'none' }
    : {};

  return (
    <div>
      <Button
        type="link"
        onClick={() => setOpen((v) => !v)}
        style={{ padding: 0, marginBottom: 6, ...commentButtonStyle }}
        size="small"
      >
        {open ? 'Hide' : 'Show'} comments ({comments.length})
      </Button>
      {open && (
        <List
          size="small"
          dataSource={comments}
          loading={loadingComments}
          renderItem={(item) => (
            <List.Item style={{ display: 'block', padding: '8px 0', border: 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.userName}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                <DistanceToNow date={new Date(item.createdAt)} />
              </div>
              <div style={{ fontSize: 14, margin: '2px 0 2px 0', whiteSpace: 'pre-line' }}>{item.comment}</div>
            </List.Item>
          )}
          locale={{ emptyText: "No comments yet" }}
        />
      )}
      {!completed && open && (
        <Form layout="inline" onFinish={handleAddComment} style={{ marginTop: 8, gap: 8 }}>
          <Form.Item style={{ flex: 1, marginBottom: 0 }}>
            <Input
              placeholder="Add a comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              size="small"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={addCommentMutation.isLoading}
              size="small"
              style={commentButtonStyle}
            >
              Comment
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
}
