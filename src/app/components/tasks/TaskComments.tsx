import addTaskCommentAction from "@/app/actions/todos/addTaskCommentAction";
import listTaskCommentsAction from "@/app/actions/todos/listTaskCommentsAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, List } from "antd";
import { useState } from "react";
import DistanceToNow from "../utils/DistanceToNow";

interface RawComment {
  id: number;
  userId: string;
  userName: string | null;
  comment: string;
  createdAt: string | Date;
}

interface Comment {
  id: number;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export function TaskComments({ taskId, completed = false }: { taskId: number, completed?: boolean }) {
  const [newComment, setNewComment] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments using server action, mapping nulls and Dates to correct types
  const { data: comments = [], isLoading: loadingComments } = useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const raw = await listTaskCommentsAction(taskId);
      return raw.map((c: RawComment) => ({
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
              <div style={{ fontWeight: 600, fontSize: 13, color: completed ? '#222' : undefined }}>{item.userName}</div>
              <div style={{ fontSize: 12, color: completed ? '#444' : '#888', marginBottom: 2 }}>
                <DistanceToNow date={new Date(item.createdAt)} />
              </div>
              <div style={{ fontSize: 14, margin: '2px 0 2px 0', whiteSpace: 'pre-line', color: completed ? '#222' : undefined }}>{item.comment}</div>
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
              loading={addCommentMutation.isPending}
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