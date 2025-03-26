export type PatchStatus = {
  server_id: string;
  hostname: string;
  os_name: string;
  current_scanned_patch: string;
  latest_available_patch: string;
  patch_status: string;
  days_behind: number;
};
