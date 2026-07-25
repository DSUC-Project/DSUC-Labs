import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dsuc-lab-jwt-secret-change-in-production';

// Custom user object type
interface UserInfo {
  id: string;
  /** Optional profile field only — not used for authentication. */
  wallet_address?: string | null;
  name: string;
  role: string;
  avatar?: string;
  skills?: string[];
  socials?: any;
  bank_info?: any;
  email?: string;
  google_id?: string;
  /** Legacy DB values may still include 'wallet' / 'both'. */
  auth_provider?: 'wallet' | 'google' | 'both';
  member_type?: 'member' | 'community';
  academy_access?: boolean;
  profile_completed?: boolean;
  is_agent?: boolean;
}

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: UserInfo;
  agent_api_key_id?: string;
}

// Declare module to override Express User type
declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }

    interface User extends UserInfo { }
  }
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email?: string;
  /** Profile snapshot only; not an auth credential. */
  wallet_address?: string;
  auth_method?: 'google';
  iat?: number;
  exp?: number;
}

const AGENT_KEY_HEADER = 'x-dsuc-agent-key';

function hashApiKey(rawKey: string) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function extractAgentApiKey(req: AuthRequest) {
  const headerKey = String(req.headers[AGENT_KEY_HEADER] || '').trim();
  if (headerKey) {
    return headerKey;
  }

  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.startsWith('Agent ')) {
    return authHeader.slice('Agent '.length).trim();
  }

  return '';
}

export function getMemberType(user?: UserInfo | null): 'member' | 'community' {
  return user?.member_type === 'community' ? 'community' : 'member';
}

export function hasAdminRole(user?: UserInfo | null): boolean {
  if (!user) {
    return false;
  }

  return ['President', 'Vice-President', 'Tech-Lead', 'Media-Lead'].includes(
    user.role
  );
}

export function hasExecutiveAdminRole(user?: UserInfo | null): boolean {
  if (!user) {
    return false;
  }

  return ['President', 'Vice-President'].includes(user.role);
}

export function isOfficialMember(user?: UserInfo | null): boolean {
  return !!user && getMemberType(user) === 'member';
}

export function hasAcademyAccess(user?: UserInfo | null): boolean {
  if (!user) {
    return false;
  }

  return user.academy_access !== false;
}

// Middleware to check if user has admin role (President, Vice-President, Tech-Lead)
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!isOfficialMember(req.user) || !hasAdminRole(req.user)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}

export function requireExecutiveAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!isOfficialMember(req.user) || !hasExecutiveAdminRole(req.user)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'President or Vice-President access required',
    });
  }

  next();
}

export function requireOfficialMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!isOfficialMember(req.user)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Official member access required',
    });
  }

  next();
}

export function requireAcademyAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!hasAcademyAccess(req.user)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Academy access is disabled for this account',
    });
  }

  next();
}

// Middleware to check if user has specific role
export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
}

// Generate JWT token for authenticated users
export function generateToken(payload: {
  userId: string;
  email?: string;
  wallet_address?: string;
  auth_method?: 'google';
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate via JWT token (for Google auth)
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.auth_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Fetch user from database
    const { data: member, error } = await db
      .from('members')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !member) {
      return res.status(404).json({
        error: 'Member Not Found',
        message: 'User account not found',
      });
    }

    // Re-check membership status on every request (JWT alone is not enough).
    if (member.is_active === false) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This account has been deactivated',
      });
    }

    req.user = member;
    next();
  } catch (error: any) {
    console.error('Token authentication error:', error);
    return res.status(500).json({
      error: 'Authentication Failed',
      message: error.message,
    });
  }
}

// Combined middleware: supports both wallet header and JWT token
export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Method 0: Agent API key (for automated admin operations)
  const agentApiKey = extractAgentApiKey(req);
  if (agentApiKey) {
    try {
      const keyHash = hashApiKey(agentApiKey);
      const { data: keys, error } = await db
        .from('admin_api_keys')
        .select('*')
        .eq('is_active', true);

      if (error) {
        return res.status(500).json({
          error: 'Database Error',
          message: error.message,
        });
      }

      const keyRow = (keys || []).find(
        (candidate: any) => String(candidate.key_hash || '') === keyHash
      );

      if (!keyRow) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or inactive agent API key',
        });
      }

      let agentUser: any = null;
      if (keyRow.created_by) {
        const { data: member, error: memberError } = await db
          .from('members')
          .select('*')
          .eq('id', keyRow.created_by)
          .single();
        if (!memberError) {
          agentUser = member;
        }
      }

      if (agentUser && agentUser.is_active === false) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Agent key owner account has been deactivated',
        });
      }

      req.user = agentUser || {
        id: keyRow.created_by || `agent-${keyRow.id}`,
        name: keyRow.name || 'Agent Admin',
        role: 'President',
        member_type: 'member',
        academy_access: true,
        is_agent: true,
      };
      req.agent_api_key_id = keyRow.id;

      // Non-blocking usage bookkeeping.
      void db
        .from('admin_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyRow.id);

      return next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'Authentication Failed',
        message: error.message,
      });
    }
  }

  // Method 1: JWT (issued after Google login)
  const token = req.cookies?.auth_token ||
    req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    return authenticateToken(req, res, next);
  }

  // Bare x-wallet-address is intentionally rejected (impersonation vector).
  if (req.headers['x-wallet-address']) {
    return res.status(401).json({
      error: 'Unauthorized',
      message:
        'Wallet headers are not accepted for authentication. Sign in with Google and send Authorization: Bearer <token>.',
    });
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Authentication token required',
  });
}
