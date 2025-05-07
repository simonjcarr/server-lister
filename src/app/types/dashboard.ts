import { BookingCodeStatusCounts } from "@/app/actions/server/dashboardActions";

export interface DashboardStats {
  totalServers: number;
  nonOnboardedServers: number;
  itarServers: number;
  bookingCodeStatuses: BookingCodeStatusCounts;
}
