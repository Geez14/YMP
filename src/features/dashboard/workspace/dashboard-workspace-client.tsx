"use client";

import { use } from "react";

import { DashboardWorkspace } from "@/features/dashboard/workspace/dashboard-workspace";
import type { DashboardWorkspaceClientProps } from "@/features/dashboard/workspace/dashboard-workspace.types";

export default function DashboardWorkspaceClient({ initialDataPromise }: DashboardWorkspaceClientProps) {
  const initialData = use(initialDataPromise);
  return <DashboardWorkspace {...initialData} />;
}
