// This file is now deprecated and can be safely removed.
import { Tabs } from "antd";
import { ChatPanel } from "../../chat/ChatPanel";
import TodoPanel from "../../todo/TodoPanel";

export default function ServerChatTodosTabs({ serverId }: { serverId: number }) {
  return (
    <Tabs
      defaultActiveKey="chat"
      items={[
        {
          key: "chat",
          label: "Chat",
          children: <ChatPanel serverId={serverId} />,
        },
        {
          key: "todos",
          label: "Todos",
          children: <TodoPanel serverId={serverId} />,
        },
      ]}
      className="h-full"
    />
  );
}
