import { Router, Response } from "express";
import { db } from "../index";
import crypto from "crypto";
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

function normalizeScopes(value: unknown) {
  if (!Array.isArray(value)) {
    return ["*"];
  }

  const scopes = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return scopes.length > 0 ? scopes : ["*"];
}

function hashApiKey(rawKey: string) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

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

router.get(
  "/agent-keys",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data, error } = await db
        .from("admin_api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          scopes: row.scopes || ["*"],
          is_active: row.is_active !== false,
          created_by: row.created_by,
          last_used_at: row.last_used_at || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

router.post(
  "/agent-keys",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const name = String(req.body?.name || "").trim();
      const scopes = normalizeScopes(req.body?.scopes);

      if (!name) {
        return res.status(400).json({
          error: "Bad Request",
          message: "name is required",
        });
      }

      const rawKey = `dsuc_agent_${crypto.randomBytes(24).toString("hex")}`;
      const keyHash = hashApiKey(rawKey);

      const { data, error } = await db
        .from("admin_api_keys")
        .insert([
          {
            name,
            key_hash: keyHash,
            scopes,
            is_active: true,
            created_by: req.user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          scopes: data.scopes || ["*"],
          is_active: data.is_active !== false,
          created_by: data.created_by,
          created_at: data.created_at,
        },
        key: rawKey,
        message: "Agent API key created. Store this key now; it will not be shown again.",
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
  "/agent-keys/:id",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (req.body?.name !== undefined) {
        updateData.name = String(req.body.name || "").trim();
      }
      if (req.body?.scopes !== undefined) {
        updateData.scopes = normalizeScopes(req.body.scopes);
      }
      if (req.body?.is_active !== undefined) {
        updateData.is_active = req.body.is_active === true;
      }

      let rotatedKey: string | null = null;
      if (req.body?.rotate === true) {
        rotatedKey = `dsuc_agent_${crypto.randomBytes(24).toString("hex")}`;
        updateData.key_hash = hashApiKey(rotatedKey);
      }

      const { data, error } = await db
        .from("admin_api_keys")
        .update(updateData)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          error: "Not Found",
          message: "Agent key not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          scopes: data.scopes || ["*"],
          is_active: data.is_active !== false,
          created_by: data.created_by,
          last_used_at: data.last_used_at || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        ...(rotatedKey ? { key: rotatedKey } : {}),
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
  "/agent-keys/:id",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { error } = await db
        .from("admin_api_keys")
        .delete()
        .eq("id", req.params.id);

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: "Agent API key deleted",
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
