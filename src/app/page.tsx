import ServerList from "@/app/components/server/ServerList";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <div>
        <ServerList />
      </div>
    </ProtectedRoute>
  );
}
