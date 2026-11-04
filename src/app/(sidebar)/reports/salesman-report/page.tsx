export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBranchListForDropdown } from "@/actions/branch-action";
import { getUserList } from "@/actions/user-action";
import { SalesmanReportClient } from "./salesman-report-client";

export default async function SalesmanReportPage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  // Security: Restricted exclusively to Main Management (admin or store_manager)
  if (role !== "admin" && role !== "store_manager") {
    redirect("/dashboard");
  }

  // Resilient data loading using Promise.allSettled so database hiccups never crash the page
  let branches: any[] = [];
  let users: any[] = [];

  try {
    const [branchesRes, usersRes] = await Promise.allSettled([
      getBranchListForDropdown(),
      getUserList(),
    ]);

    if (branchesRes.status === "fulfilled" && Array.isArray(branchesRes.value)) {
      branches = branchesRes.value;
    }

    if (usersRes.status === "fulfilled") {
      const raw =
        (usersRes.value as any)?.data ??
        (Array.isArray(usersRes.value) ? usersRes.value : []);
      users = Array.isArray(raw) ? raw : [];
    }
  } catch (err) {
    console.warn("Failed to load initial salesman filter metadata:", err);
  }

  return (
    <SalesmanReportClient
      branches={branches}
      users={users}
      userRole={role}
    />
  );
}

