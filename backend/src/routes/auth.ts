import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import {
  generateToken,
  verifyToken,
  AuthRequest,
  authenticateUser,
} from "../middleware/auth";
import { attachAcademyStatsToMember } from "../utils/academyStats";
import { IS_PRODUCTION, USE_MOCK_DB } from "../config/runtime";
import { verifyGoogleIdToken } from "../lib/googleAuth";

const router = Router();

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
type DevAuthRole = "admin" | "member" | "community";

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    // Cross-origin SPA → API in production needs Secure + SameSite=None for cookies.
    secure: IS_PRODUCTION,
    sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  };
}

function clearAuthCookie(res: Response) {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? "none" : "lax",
  });
}

const DEV_AUTH_ACCOUNTS: Record<DevAuthRole, { id: string; label: string }> = {
  admin: { id: "101240059", label: "Local Admin" },
  member: { id: "123250164", label: "Local Member" },
  community: { id: "community-001", label: "Local Community" },
};

function normalizeDevAuthRole(value: unknown): DevAuthRole {
  return value === "member" || value === "community" ? value : "admin";
}

function isLocalHostname(hostname: string | undefined) {
  return ["localhost", "127.0.0.1", "::1"].includes(String(hostname || ""));
}

function isLocalOrigin(originHeader: string | string[] | undefined) {
  const originValue = Array.isArray(originHeader)
    ? originHeader[0]
    : originHeader;

  if (!originValue) {
    return false;
  }

  try {
    return isLocalHostname(new URL(originValue).hostname);
  } catch {
    return false;
  }
}

function canUseDevAuth(req: Request) {
  return (
    USE_MOCK_DB &&
    !IS_PRODUCTION &&
    (isLocalHostname(req.hostname) || isLocalOrigin(req.headers.origin))
  );
}

function buildCommunityMemberId() {
  return `community-${uuidv4().slice(0, 8)}`;
}

function buildAuthProvider(member: any): 'wallet' | 'google' | 'both' {
  const hasWallet = !!member?.wallet_address;
  const hasGoogle = !!member?.google_id || !!member?.email;

  if (hasWallet && hasGoogle) {
    return 'both';
  }

  return hasWallet ? 'wallet' : 'google';
}

async function createCommunityAccount(params: {
  email: string;
  googleId: string;
  name?: string;
  avatar?: string;
}) {
  const communityData = {
    id: buildCommunityMemberId(),
    wallet_address: null,
    name: params.name || params.email.split("@")[0],
    role: "Community",
    member_type: "community",
    avatar:
      params.avatar ||
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
        params.email
      )}`,
    skills: [],
    socials: {},
    bank_info: {},
    email: params.email,
    google_id: params.googleId,
    auth_provider: "google",
    email_verified: true,
    academy_access: true,
    profile_completed: false,
    is_active: true,
  };

  const { data: created, error: createError } = await db
    .from("members")
    .insert([communityData])
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return attachAcademyStatsToMember(created);
}

// Configure Passport Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
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

          // No existing member found -> create a DSUC community account
          const createdCommunity = await createCommunityAccount({
            email,
            googleId,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          });

          return done(null, createdCommunity);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: any) => {
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
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(
          `${FRONTEND_URL}?error=not_member&message=Email is not registered in the system`
        );
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        wallet_address: user.wallet_address || undefined,
        auth_method: "google",
      });

      // Set token as HTTP-only cookie
      res.cookie("auth_token", token, getAuthCookieOptions());

      // Redirect to frontend with success
      res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
    } catch (error: any) {
      console.error("Google callback error:", error);
      res.redirect(`${FRONTEND_URL}?error=auth_failed`);
    }
  }
);

// POST /api/auth/google/link - Removed with wallet login (Google is the sole production auth)
router.post("/google/link", (_req: Request, res: Response) => {
  return res.status(410).json({
    error: "Gone",
    message:
      "Wallet-to-Google linking is no longer supported. Sign in with Google directly.",
  });
});
// POST /api/auth/google/login - Login with a verified Google ID token
router.post("/google/login", async (req: Request, res: Response) => {
  try {
    const credential = String(
      req.body?.credential || req.body?.id_token || ""
    ).trim();
    const authIntent = req.body?.intent === "signup" ? "signup" : "login";

    if (!credential) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Google ID token (credential) is required. Complete Google Sign-In and send the credential JWT.",
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Google Sign-In is not configured on the server",
      });
    }

    let googleIdentity;
    try {
      googleIdentity = await verifyGoogleIdToken(credential, GOOGLE_CLIENT_ID);
    } catch (verifyError: any) {
      return res.status(401).json({
        error: "Unauthorized",
        message:
          verifyError?.message || "Invalid or expired Google credential",
      });
    }

    const { email, googleId, name, avatar } = googleIdentity;

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
      if (!member.google_id || member.google_id !== googleId) {
        const { data: refreshedMember } = await db
          .from("members")
          .update({
            google_id: googleId,
            email_verified: true,
            auth_provider: buildAuthProvider({
              ...member,
              google_id: googleId,
            }),
          })
          .eq("id", member.id)
          .select()
          .single();

        if (refreshedMember) {
          member = refreshedMember;
        }
      }
    } else {
      // Try by google_id
      const { data: byGoogleId } = await db
        .from("members")
        .select("*")
        .eq("google_id", googleId)
        .eq("is_active", true)
        .single();

      if (byGoogleId) {
        member = byGoogleId;
      }
    }

    if (!member) {
      if (authIntent === "login") {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message:
            "No DSUC account was found for this Google email. Please register first.",
        });
      }

      member = await createCommunityAccount({
        email,
        googleId,
        name,
        avatar,
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: member.id,
      email: member.email,
      wallet_address: member.wallet_address || undefined,
      auth_method: "google",
    });

    const memberWithStats = await attachAcademyStatsToMember(member);

    res.cookie("auth_token", token, getAuthCookieOptions());

    res.json({
      success: true,
      data: memberWithStats,
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

// POST /api/auth/dev-login - Local-only mock login for dev
router.post("/dev-login", async (req: Request, res: Response) => {
  try {
    if (!canUseDevAuth(req)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Local dev auth is only available on localhost with mock data.",
      });
    }

    const requestedRole = normalizeDevAuthRole(req.body?.role);
    const requestedUserId =
      typeof req.body?.userId === "string" && req.body.userId.trim()
        ? req.body.userId.trim()
        : DEV_AUTH_ACCOUNTS[requestedRole].id;

    const { data: member, error } = await db
      .from("members")
      .select("*")
      .eq("id", requestedUserId)
      .single();

    if (error || !member) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Requested local dev account was not found.",
      });
    }

    const token = generateToken({
      userId: member.id,
      email: member.email,
      wallet_address: member.wallet_address || undefined,
      auth_method: "local",
    });

    const memberWithStats = await attachAcademyStatsToMember(member);

    res.cookie("auth_token", token, getAuthCookieOptions());

    res.json({
      success: true,
      data: memberWithStats,
      token,
      authMethod: "local",
      devRole: requestedRole,
      message: `${DEV_AUTH_ACCOUNTS[requestedRole].label} session created.`,
    });
  } catch (error: any) {
    console.error("Error with local dev login:", error);
    res.status(500).json({
      success: false,
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

    if (member.is_active === false) {
      return res.json({
        success: false,
        authenticated: false,
        message: "This account has been deactivated",
      });
    }

    const memberWithStats = await attachAcademyStatsToMember(member);
    const sessionAuthMethod =
      payload.auth_method === "local" ? "local" : "google";

    res.json({
      success: true,
      authenticated: true,
      data: memberWithStats,
      authMethod: sessionAuthMethod,
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
  clearAuthCookie(res);
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
