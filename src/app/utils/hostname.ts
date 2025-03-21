export async function isValidHostname(hostname: string): Promise<boolean> {
  if (!hostname) return false;
  if (hostname.length > 255) return false;

  const labels = hostname.split(".");
  const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/;

  return labels.every((label) => labelRegex.test(label));
}
