export const dynamic = "force-dynamic";

import { getAuditLogs, getActivityLogs } from "@/actions/audit-action";
import { AuditClient } from "@/components/audit/audit-client";

export default async function AuditPage() {
  const [auditResult, activityResult] = await Promise.all([
    getAuditLogs(),
    getActivityLogs(),
  ]);

  return (
    <AuditClient
      auditLogs={auditResult.data?.logs ?? []}
      activityLogs={activityResult.data?.logs ?? []}
    />
  );
}