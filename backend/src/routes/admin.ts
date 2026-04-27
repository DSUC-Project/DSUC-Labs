import { Router, Response } from "express";
import { db } from "../index";
import {
  authenticateUser,
  AuthRequest,
  requireExecutiveAdmin,
} from "../middleware/auth";

const router = Router();

const CONTENT_STATUS_OPTIONS: Record<string, string[]> = {
  events: ["Draft", "Published", "Archived"],
  projects: ["Draft", "Published", "Archived"],
  resources: ["Draft", "Published", "Archived"],
  repos: ["Draft", "Published", "Archived"],
  bounties: ["Open", "In Progress", "Completed", "Closed"],
};

const DELETABLE_CONTENT_ENTITIES = new Set([
  "events",
  "projects",
  "resources",
  "repos",
  "bounties",
]);

function sortByCreatedAtDesc(list: any[]) {
  return [...list].sort((a: any, b: any) => {
    const left = String(a.created_at || "");
    const right = String(b.created_at || "");
    return left < right ? 1 : left > right ? -1 : 0;
  });
}

router.get(
  "/overview",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        { data: events, error: eventsError },
        { data: projects, error: projectsError },
        { data: resources, error: resourcesError },
        { data: bounties, error: bountiesError },
        { data: repos, error: reposError },
        { data: financeRequests, error: financeRequestsError },
        { data: financeHistory, error: financeHistoryError },
      ] = await Promise.all([
        db.from("events").select("*"),
        db.from("projects").select("*"),
        db.from("resources").select("*"),
        db.from("bounties").select("*"),
        db.from("repos").select("*"),
        db.from("finance_requests").select("*"),
        db.from("finance_history").select("*"),
      ]);

      const error =
        eventsError ||
        projectsError ||
        resourcesError ||
        bountiesError ||
        reposError ||
        financeRequestsError ||
        financeHistoryError;

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: {
          events: sortByCreatedAtDesc(events || []),
          projects: sortByCreatedAtDesc(projects || []),
          resources: sortByCreatedAtDesc(resources || []),
          bounties: sortByCreatedAtDesc(bounties || []),
          repos: sortByCreatedAtDesc(repos || []),
          finance_requests: sortByCreatedAtDesc(financeRequests || []),
          finance_history: sortByCreatedAtDesc(financeHistory || []),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

router.patch(
  "/content/:entity/:id/status",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity, id } = req.params;
      const nextStatus = String(req.body?.status || "").trim();
      const allowedStatuses = CONTENT_STATUS_OPTIONS[entity];

      if (!allowedStatuses) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Unsupported entity for status management",
        });
      }

      if (!allowedStatuses.includes(nextStatus)) {
        return res.status(400).json({
          error: "Bad Request",
          message: `status must be one of: ${allowedStatuses.join(", ")}`,
        });
      }

      const { data: updatedRow, error } = await db
        .from(entity as any)
        .update({ status: nextStatus })
        .eq("id", id)
        .select()
        .single();

      if (error || !updatedRow) {
        return res.status(404).json({
          error: "Not Found",
          message: "Record not found",
        });
      }

      res.json({
        success: true,
        data: updatedRow,
        message: "Status updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

router.delete(
  "/content/:entity/:id",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity, id } = req.params;

      if (!DELETABLE_CONTENT_ENTITIES.has(entity)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Unsupported entity for deletion",
        });
      }

      const { error } = await db.from(entity as any).delete().eq("id", id);

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: "Record deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

export default router;
