import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../index";
import { generateToken, verifyToken, AuthRequest, authenticateWallet } from "../middleware/auth";

const router = Router();

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Configure Passport Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;

          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if user exists by email or google_id
          const { data: existingMember, error } = await db
            .from("members")
            .select("*")
            .or(`email.eq.${email},google_id.eq.${googleId}`)
            .single();

          if (existingMember) {
            // Update google_id if not set
            if (!existingMember.google_id) {
              await db
                .from("members")
                .update({
                  google_id: googleId,
                  email_verified: true,
                  auth_provider: existingMember.wallet_address ? 'both' : 'google'
                })
                .eq("id", existingMember.id);
            }
            return done(null, existingMember);
          }

          // No existing member found
          return done(null, false);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("id", id)
      .single();
    done(null, member);
  } catch (error) {
    done(error, null);
  }
});

// POST /api/auth/wallet - Authenticate by wallet address (used by frontend)
router.post("/wallet", async (req: Request, res: Response) => {
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
          "Wallet address not registered. Only pre-registered members can access.",
      });
    }

    res.json({
      success: true,
      data: member,
      message: "Authentication successful",
    });
  } catch (error: any) {
    console.error("Error authenticating wallet:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// GET /api/auth/google - Initiate Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}?error=auth_failed`,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect(
          `${FRONTEND_URL}?error=not_member&message=Email không được đăng ký trong hệ thống`
        );
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
      });

      // Set token as HTTP-only cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with success
      res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
    } catch (error: any) {
      console.error("Google callback error:", error);
      res.redirect(`${FRONTEND_URL}?error=auth_failed`);
    }
  }
);

// POST /api/auth/google/link - Link Google account to existing wallet account
router.post("/google/link", async (req: Request, res: Response) => {
  try {
    const { wallet_address, google_token } = req.body;

    if (!wallet_address || !google_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "wallet_address and google_token are required",
      });
    }

    // Verify the Google token and extract user info
    // In production, you would verify this token with Google's API
    // For now, we'll accept the token payload directly from frontend
    const { email, google_id } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "email and google_id are required",
      });
    }

    // Check if wallet exists
    const { data: member, error: memberError } = await db
      .from("members")
      .select("*")
      .eq("wallet_address", wallet_address)
      .single();

    if (memberError || !member) {
      return res.status(404).json({
        error: "Not Found",
        message: "Wallet address not found",
      });
    }

    // Check if email is already linked to another account
    const { data: existingEmail } = await db
      .from("members")
      .select("id")
      .eq("email", email)
      .neq("id", member.id)
      .single();

    if (existingEmail) {
      return res.status(409).json({
        error: "Conflict",
        message: "Email đã được liên kết với tài khoản khác",
      });
    }

    // Update member with Google info
    const { data: updatedMember, error: updateError } = await db
      .from("members")
      .update({
        email: email,
        google_id: google_id,
        auth_provider: "both",
        email_verified: true,
      })
      .eq("id", member.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedMember,
      message: "Google account linked successfully",
    });
  } catch (error: any) {
    console.error("Error linking Google account:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/auth/google/login - Login with Google token (alternative to OAuth redirect)
router.post("/google/login", async (req: Request, res: Response) => {
  try {
    const { email, google_id, name, avatar } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "email and google_id are required",
      });
    }

    // Find member by email or google_id
    let member;
    const { data: byEmail } = await db
      .from("members")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (byEmail) {
      member = byEmail;
      // Update google_id if not set
      if (!member.google_id) {
        await db
          .from("members")
          .update({
            google_id,
            email_verified: true,
            auth_provider: member.wallet_address ? 'both' : 'google'
          })
          .eq("id", member.id);
      }
    } else {
      // Try by google_id
      const { data: byGoogleId } = await db
        .from("members")
        .select("*")
        .eq("google_id", google_id)
        .eq("is_active", true)
        .single();

      if (byGoogleId) {
        member = byGoogleId;
      }
    }

    if (!member) {
      return res.status(404).json({
        error: "Not Found",
        message: "Email không được đăng ký trong hệ thống. Chỉ thành viên đã đăng ký mới có thể truy cập.",
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: member.id,
      email: member.email,
      wallet_address: member.wallet_address,
    });

    res.json({
      success: true,
      data: member,
      token: token,
      message: "Login successful",
    });
  } catch (error: any) {
    console.error("Error with Google login:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// GET /api/auth/session - Check current session/token
router.get("/session", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.json({
        success: false,
        authenticated: false,
        message: "No session found",
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.json({
        success: false,
        authenticated: false,
        message: "Invalid or expired token",
      });
    }

    // Fetch current user data
    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("id", payload.userId)
      .single();

    if (error || !member) {
      return res.json({
        success: false,
        authenticated: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      authenticated: true,
      data: member,
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    res.json({
      success: false,
      authenticated: false,
      message: error.message,
    });
  }
});

// POST /api/auth/logout - Clear session
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("auth_token");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
