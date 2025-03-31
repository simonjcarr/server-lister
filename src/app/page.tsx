'use client';

import { useState } from "react";
import Dashboard from "@/app/components/dashboard/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('servers');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Dashboard onTabChange={handleTabChange} />
      </div>
    </ProtectedRoute>
  );
}
