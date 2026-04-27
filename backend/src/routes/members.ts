import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index";
import {
  authenticateUser,
  AuthRequest,
  requireExecutiveAdmin,
} from "../middleware/auth";
import {
  upload,
  uploadBase64ToSupabase,
  uploadBase64ToImageBB,
} from "../middleware/upload";
import {
  attachAcademyStatsToMember,
  attachAcademyStatsToMembers,
} from "../utils/academyStats";

const router = Router();

// Role priority mapping
const ROLE_PRIORITY: { [key: string]: number } = {
  "President": 1,
  "Vice-President": 2,
  "Tech-Lead": 3,
  "Media-Lead": 3,
  "Member": 4,
  "Community": 5,
};

function buildMemberId(memberType: string) {
  return `${memberType}-${uuidv4().slice(0, 8)}`;
}

function normalizeMemberType(value: unknown): "member" | "community" {
  return value === "community" ? "community" : "member";
}

function normalizeRole(memberType: "member" | "community", role?: string) {
  if (memberType === "community") {
    return "Community";
  }

  return role || "Member";
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

// GET /api/members - Get all members
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data: members, error } = await db
      .from("members")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Database Error",
        message: error.message,
      });
    }

    const sortedMembers = await attachAcademyStatsToMembers(
      sortMembers(members || [])
    );

    res.json({
      success: true,
      data: sortedMembers,
      count: sortedMembers?.length || 0,
      meta: {
        members: sortedMembers.filter(
          (member: any) => normalizeMemberType(member.member_type) === "member"
        ).length,
        community: sortedMembers.filter(
          (member: any) =>
            normalizeMemberType(member.member_type) === "community"
        ).length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/members/admin/list - Get all users for admin management
router.get(
  "/admin/list",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: members, error } = await db
        .from("members")
        .select("*");

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      const sortedMembers = await attachAcademyStatsToMembers(
        sortMembers(members || [])
      );

      res.json({
        success: true,
        data: sortedMembers,
        count: sortedMembers.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// POST /api/members/admin/users - Create member/community user from admin
router.post(
  "/admin/users",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const memberType = normalizeMemberType(req.body?.member_type);
      const role = normalizeRole(memberType, req.body?.role);
      const name = String(req.body?.name || "").trim();
      const email = req.body?.email ? String(req.body.email).trim() : null;
      const walletAddress = req.body?.wallet_address
        ? String(req.body.wallet_address).trim()
        : null;

      if (!name) {
        return res.status(400).json({
          error: "Bad Request",
          message: "name is required",
        });
      }

      const userData = {
        id: String(req.body?.id || buildMemberId(memberType)).trim(),
        name,
        role,
        member_type: memberType,
        email,
        wallet_address: walletAddress,
        avatar:
          req.body?.avatar ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
            name
          )}`,
        skills: Array.isArray(req.body?.skills) ? req.body.skills : [],
        socials: req.body?.socials || {},
        bank_info: req.body?.bank_info || {},
        academy_access: req.body?.academy_access !== false,
        profile_completed:
          req.body?.profile_completed === true ? true : !email,
        is_active: req.body?.is_active !== false,
        email_verified: req.body?.email_verified === true,
        auth_provider: walletAddress && email ? "both" : walletAddress ? "wallet" : "google",
      };

      const { data: createdUser, error } = await db
        .from("members")
        .insert([userData])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      const createdUserWithStats = await attachAcademyStatsToMember(createdUser);

      res.status(201).json({
        success: true,
        data: createdUserWithStats,
        message: "User created successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// PATCH /api/members/admin/users/:id - Update user access, type, role
router.patch(
  "/admin/users/:id",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: existingMember, error: fetchError } = await db
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !existingMember) {
        return res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
      }

      const memberType = normalizeMemberType(
        req.body?.member_type ?? existingMember.member_type
      );

      const updateData: any = {
        updated_at: new Date().toISOString(),
        member_type: memberType,
        role: normalizeRole(memberType, req.body?.role ?? existingMember.role),
      };

      if (req.body?.name !== undefined) updateData.name = req.body.name;
      if (req.body?.email !== undefined) updateData.email = req.body.email || null;
      if (req.body?.wallet_address !== undefined) {
        updateData.wallet_address = req.body.wallet_address || null;
      }
      if (req.body?.academy_access !== undefined) {
        updateData.academy_access = req.body.academy_access === true;
      }
      if (req.body?.profile_completed !== undefined) {
        updateData.profile_completed = req.body.profile_completed === true;
      }
      if (req.body?.is_active !== undefined) {
        updateData.is_active = req.body.is_active === true;
      }

      const nextWallet = updateData.wallet_address ?? existingMember.wallet_address;
      const nextEmail = updateData.email ?? existingMember.email;
      updateData.auth_provider = nextWallet && nextEmail ? "both" : nextWallet ? "wallet" : "google";

      const { data: updatedMember, error } = await db
        .from("members")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      const updatedMemberWithStats = await attachAcademyStatsToMember(updatedMember);

      res.json({
        success: true,
        data: updatedMemberWithStats,
        message: "User updated successfully",
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
  "/admin/users/:id",
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({
          error: "Bad Request",
          message: "You cannot delete your own account from admin",
        });
      }

      const { data: existingMember, error: fetchError } = await db
        .from("members")
        .select("id")
        .eq("id", id)
        .single();

      if (fetchError || !existingMember) {
        return res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
      }

      await Promise.all([
        db.from("events").update({ created_by: null }).eq("created_by", id),
        db.from("projects").update({ created_by: null }).eq("created_by", id),
        db.from("resources").update({ created_by: null }).eq("created_by", id),
        db.from("bounties").update({ created_by: null }).eq("created_by", id),
        db.from("repos").update({ created_by: null }).eq("created_by", id),
      ]);

      const { error } = await db.from("members").delete().eq("id", id);

      if (error) {
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

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

    const memberWithStats = await attachAcademyStatsToMember(member);

    res.json({
      success: true,
      data: memberWithStats,
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
          "Wallet address not registered. Please sign in with Google first or ask an admin to add your wallet.",
      });
    }

    const memberWithStats = await attachAcademyStatsToMember(member);

    res.json({
      success: true,
      data: memberWithStats,
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
  authenticateUser as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        avatar,
        skills,
        socials,
        bankInfo,
        bank_info,
        profile_completed,
      } =
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
      if (skills !== undefined) updateData.skills = skills;
      if (socials !== undefined) updateData.socials = socials;
      if (profile_completed !== undefined) {
        updateData.profile_completed = profile_completed === true;
      }
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

      const updatedMemberWithStats = await attachAcademyStatsToMember(updatedMember);

      res.json({
        success: true,
        data: updatedMemberWithStats,
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

    const memberWithStats = await attachAcademyStatsToMember(member);

    res.json({
      success: true,
      data: memberWithStats,
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
