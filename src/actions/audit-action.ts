'use server';

import { auditDb } from "@/lib/mock-audit-db";
import { actionClient } from "@/lib/safeAction";

export const getAuditLogs = actionClient.action(async () => {
  try {
    const logs = [...auditDb.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return { logs };
  } catch (error) {
    return { error: "Something went wrong" };
  }
});

export const getActivityLogs = actionClient.action(async () => {
  try {
    const logs = [...auditDb.activityLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return { logs };
  } catch (error) {
    return { error: "Something went wrong" };
  }
});