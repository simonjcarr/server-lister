'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ServerList from "@/app/components/server/ServerList";
import ProtectedRoute from "../components/auth/ProtectedRoute";

export default function ServerPage() {
  const searchParams = useSearchParams();
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);
  
  // Extract the onboardingStatus from the URL if present
  const onboardingStatus = searchParams.get('onboardingStatus');
  
  // Use this flag to trigger the ServerList to apply initial filters
  // This would need to be implemented in the ServerList component
  
  useEffect(() => {
    if (onboardingStatus && !initialFilterApplied) {
      // You could dispatch an event or use another mechanism to notify
      // the ServerList component about initial filters
      setInitialFilterApplied(true);
      
      // For this implementation, we'll use a custom event
      const event = new CustomEvent('applyServerFilters', {
        detail: { onboardingStatus }
      });
      window.dispatchEvent(event);
    }
  }, [onboardingStatus, initialFilterApplied]);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <ServerList />
      </div>
    </ProtectedRoute>
  );
}
