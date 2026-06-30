import { Router, Request, Response } from "express";
import { db } from "../db";
import { attachAcademyStatsToMembers } from "../utils/academyStats";

const router = Router();

const ROLE_PRIORITY: Record<string, number> = {
  President: 1,
  "Vice-President": 2,
  "Tech-Lead": 3,
  "Media-Lead": 3,
  Member: 4,
  Community: 5,
};

function normalizeMemberType(value: unknown): "member" | "community" {
  return value === "community" ? "community" : "member";
}

function sortMembers(list: any[]) {
  return [...list].sort((a: any, b: any) => {
    const typePriorityA = normalizeMemberType(a.member_type) === "member" ? 0 : 1;
    const typePriorityB = normalizeMemberType(b.member_type) === "member" ? 0 : 1;

    if (typePriorityA !== typePriorityB) {
      return typePriorityA - typePriorityB;
    }

    const priorityA = ROLE_PRIORITY[a.role] || 99;
    const priorityB = ROLE_PRIORITY[b.role] || 99;
    return priorityA - priorityB;
  });
}

function findFailedQuery(results: Record<string, any>) {
  return Object.entries(results).find(([, result]) => result?.error);
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [
      members,
      financeHistory,
      events,
      projects,
      resources,
      bounties,
      repos,
    ] = await Promise.all([
      db.from("members").select("*").eq("is_active", true),
      db.from("finance_history").select("*").order("date", { ascending: false }),
      db
        .from("events")
        .select("*")
        .eq("status", "Published")
        .order("date", { ascending: true }),
      db
        .from("projects")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false }),
      db
        .from("resources")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false }),
      db.from("bounties").select("*").order("created_at", { ascending: false }),
      db
        .from("repos")
        .select("*")
        .eq("status", "Published")
        .order("stars", { ascending: false }),
    ]);

    const results = {
      members,
      financeHistory,
      events,
      projects,
      resources,
      bounties,
      repos,
    };
    const failed = findFailedQuery(results);

    if (failed) {
      const [source, result] = failed;
      console.error(`[bootstrap] ${source} query failed:`, result.error);
      return res.status(500).json({
        error: "Database Error",
        source,
        message: result.error.message,
      });
    }

    const sortedMembers = await attachAcademyStatsToMembers(
      sortMembers(members.data || []),
    );

    res.json({
      success: true,
      data: {
        members: sortedMembers,
        financeHistory: financeHistory.data || [],
        events: events.data || [],
        projects: projects.data || [],
        resources: resources.data || [],
        bounties: bounties.data || [],
        repos: repos.data || [],
      },
      count: {
        members: sortedMembers.length,
        financeHistory: financeHistory.data?.length || 0,
        events: events.data?.length || 0,
        projects: projects.data?.length || 0,
        resources: resources.data?.length || 0,
        bounties: bounties.data?.length || 0,
        repos: repos.data?.length || 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching bootstrap data:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

export default router;
