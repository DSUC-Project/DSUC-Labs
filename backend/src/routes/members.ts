import { Router, Request, Response } from "express";
import { db } from "../index";
import {
  authenticateWallet,
  AuthRequest,
  requireAdmin,
} from "../middleware/auth";
import {
  upload,
  uploadBase64ToSupabase,
  uploadBase64ToImageBB,
} from "../middleware/upload";

const router = Router();

// GET /api/members - Get all members
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data: members, error } = await db
      .from("members")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Database Error",
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: members,
      count: members?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/members/:id - Get member by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !member) {
      return res.status(404).json({
        error: "Not Found",
        message: "Member not found",
      });
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Error fetching member:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/members/auth - Authenticate with wallet address
router.post("/auth", async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({
        error: "Bad Request",
        message: "wallet_address is required",
      });
    }

    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("wallet_address", wallet_address)
      .eq("is_active", true)
      .single();

    if (error || !member) {
      return res.status(404).json({
        error: "Not Found",
        message:
          "Wallet address not registered. Only 15 pre-registered members can access.",
      });
    }

    res.json({
      success: true,
      data: member,
      message: "Authentication successful",
    });
  } catch (error: any) {
    console.error("Error authenticating member:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// PUT /api/members/:id - Update member profile (requires authentication)
router.put(
  "/:id",
  authenticateWallet,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, role, avatar, skills, socials, bankInfo, bank_info } =
        req.body;

      console.log(
        "[PUT /api/members/:id] Request body:",
        JSON.stringify(req.body, null, 2)
      );
      console.log(
        "[PUT /api/members/:id] User ID:",
        req.user?.id,
        "Target ID:",
        id
      );

      // Verify user is updating their own profile
      if (req.user!.id !== id) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only update your own profile",
        });
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (skills !== undefined) updateData.skills = skills;
      if (socials !== undefined) updateData.socials = socials;
      // Support both camelCase and snake_case
      if (bankInfo !== undefined) updateData.bank_info = bankInfo;
      if (bank_info !== undefined) updateData.bank_info = bank_info;

      console.log(
        "[PUT /api/members/:id] Update data before avatar:",
        JSON.stringify(updateData, null, 2)
      );

      // Handle avatar upload if it's base64
      if (avatar && avatar.startsWith("data:image")) {
        try {
          console.log("[members.ts] Uploading avatar to ImageBB...");
          const avatarUrl = await uploadBase64ToImageBB(avatar);
          updateData.avatar = avatarUrl;
          console.log("[members.ts] Avatar uploaded successfully:", avatarUrl);
        } catch (uploadError: any) {
          console.error("Avatar upload error:", uploadError);
          return res.status(500).json({
            error: "Upload Error",
            message: `Failed to upload avatar: ${uploadError.message}`,
          });
        }
      } else if (avatar) {
        updateData.avatar = avatar;
      }

      const { data: updatedMember, error } = await db
        .from("members")
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
        data: updatedMember,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating member:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// PATCH /api/members/:id/role - Update member role (Admin only)
// Role changes are ONLY allowed through direct database access
// This endpoint is disabled to enforce security
router.patch(
  "/:id/role",
  authenticateWallet,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    return res.status(403).json({
      error: "Forbidden",
      message:
        "Role changes are not allowed through API. Please access database directly.",
    });
  }
);

// GET /api/members/wallet/:wallet_address - Get member by wallet address
router.get("/wallet/:wallet_address", async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.params;

    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("wallet_address", wallet_address)
      .eq("is_active", true)
      .single();

    if (error || !member) {
      return res.status(404).json({
        error: "Not Found",
        message: "Member not found",
      });
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Error fetching member:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

export default router;
