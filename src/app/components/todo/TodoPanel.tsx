"use client";
import { useEffect, useState } from "react";
import { Collapse, Checkbox, Button, Input, Spin, Empty, Form, List, Typography, Space } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import DistanceToNow from "../utils/DistanceToNow";

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
}
interface Comment {
  id: number;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export default function TodoPanel({ serverId }: { serverId: number }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoPublic, setNewTodoPublic] = useState(false);
  const [expanded, setExpanded] = useState<string | string[]>([]);

  useEffect(() => {
    fetch(`/api/todos?serverId=${serverId}`)
      .then((r) => r.json())
      .then((data) => setTodos(data))
      .finally(() => setLoading(false));
  }, [serverId]);

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) return;
    setLoading(true);
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId, title: newTodoTitle, isPublic: newTodoPublic }),
    });
    if (res.ok) {
      setNewTodoTitle("");
      setNewTodoPublic(false);
      setTodos(await res.json().then((todo) => [todo, ...todos]));
    }
    setLoading(false);
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
          <Button type="primary" htmlType="submit" loading={loading} size="small">
            Add Todo
          </Button>
        </Form.Item>
      </Form>
      {loading ? (
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    fetch(`/api/todos/tasks?todoId=${todoId}`)
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [todoId]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    const res = await fetch("/api/todos/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoId, title: newTaskTitle }),
    });
    if (res.ok) {
      setTasks([...tasks, await res.json()]);
      setNewTaskTitle("");
    }
    setLoading(false);
  };

  const handleToggleTask = async (task: Task) => {
    setLoading(true);
    const res = await fetch("/api/todos/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, isComplete: !task.isComplete }),
    });
    if (res.ok) {
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, isComplete: !t.isComplete } : t)));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 8, background: '#232326', borderRadius: 6 }}>
      <Form layout="inline" onFinish={handleAddTask} style={{ marginBottom: 14, gap: 8 }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            placeholder="New task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
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
        renderItem={(task, idx) => (
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
                <TaskComments taskId={task.id} completed={task.isComplete} />
              </div>
            </List.Item>
            {idx < tasks.length - 1 && (
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/todos/comments?taskId=${taskId}`)
      .then((r) => r.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    const res = await fetch("/api/todos/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, comment: newComment }),
    });
    if (res.ok) {
      setComments([...comments, await res.json()]);
      setNewComment("");
      setOpen(true);
    }
    setLoading(false);
  };

  const commentButtonStyle = completed
    ? { color: '#15803d', background: 'rgba(34,197,94,0.08)', border: '1px solid #bbf7d0', borderRadius: 4 }
    : {};

  const commentTextStyle = completed ? { color: '#222', fontWeight: 500 } : {};
  const commentMetaStyle = completed ? { color: '#444' } : {};

  return (
    <div style={{ marginTop: 8, width: '100%' }}>
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
          renderItem={(c) => (
            <List.Item style={{ padding: '8px 0', border: 'none', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography.Text strong style={{ fontSize: 13, ...commentMetaStyle }}>{c.userName}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, ...commentMetaStyle }}>{<DistanceToNow date={new Date(c.createdAt)} />}</Typography.Text>
              <span style={{ fontSize: 14, marginTop: 2, ...commentTextStyle }}>{c.comment}</span>
            </List.Item>
          )}
          locale={{ emptyText: loading ? <Spin size="small" /> : <span style={{ color: '#777' }}>No comments</span> }}
          style={{ marginBottom: 6, width: '100%' }}
        />
      )}
      <Form layout="inline" onFinish={handleAddComment} style={{ marginTop: 2, gap: 8, width: '100%' }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            placeholder="Add comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ minWidth: 120 }}
            size="small"
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} size="small" style={commentButtonStyle}>
            Comment
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
