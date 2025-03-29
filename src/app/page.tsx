import ServerList from "@/app/components/server/ServerList";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FavoriteServers from "./components/server/favorites/FavoriteServers";

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <FavoriteServers />
        <ServerList />
      </div>
    </ProtectedRoute>
  );
}
