'use client'
import { useQuery } from "@tanstack/react-query";
import { getRoomMessages } from "@/app/actions/chat/crudActions";
import { useEffect, useState } from "react";
import { Card } from "antd";

const ChatComponent = ({ chatRoomId }: { chatRoomId: string }) => {
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages"],
    queryFn: () => getRoomMessages(chatRoomId, lastMessageId),
    enabled: true,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      setLastMessageId(data[0].id);
    }
  }, [data])
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <Card title="Chat">
          {data?.map((message) => (
            <div key={message.id}>
              <p>{message.message}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default ChatComponent