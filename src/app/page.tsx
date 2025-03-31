import Dashboard from "@/app/components/dashboard/Dashboard";
import ServerList from "@/app/components/server/ServerList";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Dashboard />
        <ServerList />
      </div>
    </ProtectedRoute>
  );
}
