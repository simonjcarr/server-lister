import { BookingCodeStatusType } from "@/app/actions/reports/bookingCodes";

export interface BookingCodeStatusReportItem {
  groupId: number;
  groupName: string;
  codeId: number | null;
  code: string | null;
  description: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  status: BookingCodeStatusType;
  daysUntilExpiration: number | null;
}
