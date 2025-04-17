"use client";
import { useEffect, useState } from "react";
import { Collapse, Checkbox, Button, Input, Spin, Empty, Form, List, Typography, Space } from "antd";
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
    <div className="h-full overflow-y-auto p-2">
      <Form layout="inline" onFinish={handleCreateTodo} className="mb-2">
        <Form.Item>
          <Input
            placeholder="New todo title"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item>
          <Checkbox checked={newTodoPublic} onChange={(e) => setNewTodoPublic(e.target.checked)}>
            Public
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
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
          items={todos.map((todo) => ({
            key: todo.id.toString(),
            label: (
              <Space>
                <Typography.Text>{todo.title}</Typography.Text>
                {todo.isPublic ? <Typography.Text type="secondary">Public</Typography.Text> : <Typography.Text type="secondary">Private</Typography.Text>}
                <DistanceToNow date={new Date(todo.createdAt)} />
              </Space>
            ),
            children: <TodoTasks todoId={todo.id} />,
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
    <div>
      <Form layout="inline" onFinish={handleAddTask} className="mb-2">
        <Form.Item>
          <Input
            placeholder="New task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ width: 180 }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Task
          </Button>
        </Form.Item>
      </Form>
      <List
        dataSource={tasks}
        renderItem={(task) => (
          <List.Item>
            <Checkbox checked={task.isComplete} onChange={() => handleToggleTask(task)}>
              {task.title}
            </Checkbox>
            <TaskComments taskId={task.id} />
          </List.Item>
        )}
      />
    </div>
  );
}

function TaskComments({ taskId }: { taskId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

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
    }
    setLoading(false);
  };

  return (
    <div style={{ marginLeft: 32, marginTop: 8, width: '100%' }}>
      <List
        size="small"
        dataSource={comments}
        renderItem={(c) => (
          <List.Item>
            <Space>
              <Typography.Text strong>{c.userName}</Typography.Text>
              <Typography.Text type="secondary">
                <DistanceToNow date={new Date(c.createdAt)} />
              </Typography.Text>
              <span>{c.comment}</span>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: loading ? <Spin size="small" /> : "No comments" }}
      />
      <Form layout="inline" onFinish={handleAddComment} style={{ marginTop: 4 }}>
        <Form.Item>
          <Input
            placeholder="Add comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ width: 180 }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Comment
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
