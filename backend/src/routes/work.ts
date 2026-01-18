import { Router, Request, Response } from "express";
import { db } from "../index";
import { authenticateWallet, AuthRequest } from "../middleware/auth";

const router = Router();

// ============ BOUNTIES ROUTES ============

// GET /api/work/bounties - Get all bounties
router.get("/bounties", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = db
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: bounties, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Database Error",
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: bounties,
      count: bounties?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching bounties:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/work/bounties/:id - Get bounty by ID
router.get("/bounties/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: bounty, error } = await db
      .from("bounties")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !bounty) {
      return res.status(404).json({
        error: "Not Found",
        message: "Bounty not found",
      });
    }

    res.json({
      success: true,
      data: bounty,
    });
  } catch (error: any) {
    console.error("Error fetching bounty:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/work/bounties - Create new bounty (requires authentication)
router.post(
  "/bounties",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, reward, difficulty, tags, submitLink } =
        req.body;

      if (!title) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Title is required",
        });
      }

      const bountyData = {
        title,
        description,
        reward,
        difficulty: difficulty || "Medium",
        tags: tags || [],
        status: "Open",
        submit_link: submitLink || null,
        created_by: req.user!.id,
      };

      const { data: newBounty, error } = await db
        .from("bounties")
        .insert([bountyData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.status(201).json({
        success: true,
        data: newBounty,
        message: "Bounty created successfully",
      });
    } catch (error: any) {
      console.error("Error creating bounty:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// PUT /api/work/bounties/:id - Update bounty
router.put(
  "/bounties/:id",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, reward, difficulty, tags, status } = req.body;

      // Check if bounty exists
      const { data: existingBounty, error: fetchError } = await db
        .from("bounties")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !existingBounty) {
        return res.status(404).json({
          error: "Not Found",
          message: "Bounty not found",
        });
      }

      // Only creator or admin can update
      const adminRoles = ["President", "Vice-President", "Tech-Lead"];
      if (
        existingBounty.created_by !== req.user!.id &&
        !adminRoles.includes(req.user!.role)
      ) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to update this bounty",
        });
      }

      const updateData: any = {};

      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (reward !== undefined) updateData.reward = reward;
      if (difficulty) updateData.difficulty = difficulty;
      if (tags) updateData.tags = tags;
      if (status) updateData.status = status;

      const { data: updatedBounty, error } = await db
        .from("bounties")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: updatedBounty,
        message: "Bounty updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating bounty:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// DELETE /api/work/bounties/:id - Delete bounty (Admin only)
router.delete(
  "/bounties/:id",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Only admin can delete
      const adminRoles = ["President", "Vice-President", "Tech-Lead"];
      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only admins can delete bounties",
        });
      }

      const { error } = await db.from("bounties").delete().eq("id", id);

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: "Bounty deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting bounty:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// ============ REPOS ROUTES ============

// GET /api/work/repos - Get all repos
router.get("/repos", async (req: Request, res: Response) => {
  try {
    const { data: repos, error } = await db
      .from("repos")
      .select("*")
      .order("stars", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Database Error",
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: repos,
      count: repos?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching repos:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/work/repos/:id - Get repo by ID
router.get("/repos/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: repo, error } = await db
      .from("repos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !repo) {
      return res.status(404).json({
        error: "Not Found",
        message: "Repository not found",
      });
    }

    res.json({
      success: true,
      data: repo,
    });
  } catch (error: any) {
    console.error("Error fetching repo:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/work/repos - Create new repo (requires authentication)
router.post(
  "/repos",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, language, url, stars, forks } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Repository name is required",
        });
      }

      const repoData = {
        name,
        description,
        language,
        url,
        stars: stars || 0,
        forks: forks || 0,
        created_by: req.user!.id,
      };

      const { data: newRepo, error } = await db
        .from("repos")
        .insert([repoData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.status(201).json({
        success: true,
        data: newRepo,
        message: "Repository created successfully",
      });
    } catch (error: any) {
      console.error("Error creating repo:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// PUT /api/work/repos/:id - Update repo
router.put(
  "/repos/:id",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, language, url, stars, forks } = req.body;

      // Check if repo exists
      const { data: existingRepo, error: fetchError } = await db
        .from("repos")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !existingRepo) {
        return res.status(404).json({
          error: "Not Found",
          message: "Repository not found",
        });
      }

      // Only creator or admin can update
      const adminRoles = ["President", "Vice-President", "Tech-Lead"];
      if (
        existingRepo.created_by !== req.user!.id &&
        !adminRoles.includes(req.user!.role)
      ) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to update this repository",
        });
      }

      const updateData: any = {};

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (language) updateData.language = language;
      if (url !== undefined) updateData.url = url;
      if (stars !== undefined) updateData.stars = stars;
      if (forks !== undefined) updateData.forks = forks;

      const { data: updatedRepo, error } = await db
        .from("repos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: updatedRepo,
        message: "Repository updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating repo:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// DELETE /api/work/repos/:id - Delete repo (Admin only)
router.delete(
  "/repos/:id",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Only admin can delete
      const adminRoles = ["President", "Vice-President", "Tech-Lead"];
      if (!adminRoles.includes(req.user!.role)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only admins can delete repositories",
        });
      }

      const { error } = await db.from("repos").delete().eq("id", id);

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: "Repository deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting repo:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

export default router;
