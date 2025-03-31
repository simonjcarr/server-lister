import ServerList from "@/app/components/server/ServerList";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";

export default function ServerListPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <ServerList />
      </div>
    </ProtectedRoute>
  );
}
