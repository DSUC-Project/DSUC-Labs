import { Request, Response, NextFunction } from 'express';
import { db } from '../index';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'dsuc-lab-jwt-secret-change-in-production';

// Custom user object type
interface UserInfo {
  id: string;
  wallet_address: string;
  name: string;
  role: string;
  avatar?: string;
  skills?: string[];
  socials?: any;
  bank_info?: any;
  email?: string;
  google_id?: string;
  auth_provider?: 'wallet' | 'google' | 'both';
}

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: UserInfo;
}

// Declare module to override Express User type
declare global {
  namespace Express {
    interface User extends UserInfo { }
  }
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email?: string;
  wallet_address?: string;
  iat?: number;
  exp?: number;
}

// Middleware to authenticate wallet address
export async function authenticateWallet(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Wallet address is required in x-wallet-address header',
      });
    }

    // In mock mode, skip Solana validation for simpler local dev
    if (!USE_MOCK_DB) {
      // Validate Solana address format (production only)
      try {
        new PublicKey(walletAddress);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid Wallet',
          message: 'Invalid Solana wallet address format',
        });
      }
    }

    // Query member from database
    let query = db
      .from('members')
      .select('*')
      .eq('wallet_address', walletAddress);

    // Only check is_active in production (Supabase has this field)
    if (!USE_MOCK_DB) {
      query = query.eq('is_active', true);
    }

    const { data: member, error } = await (USE_MOCK_DB ? query : query.single());

    // In mock mode, get first result from array
    const foundMember = USE_MOCK_DB ? (Array.isArray(member) ? member[0] : member) : member;

    if (error || !foundMember) {
      return res.status(404).json({
        error: 'Member Not Found',
        message: 'Wallet address not registered in the system',
      });
    }

    // Attach user info to request
    req.user = foundMember;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication Failed',
      message: error.message,
    });
  }
}

// Middleware to check if user has admin role (President, Vice-President, Tech-Lead)
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const adminRoles = ['President', 'Vice-President', 'Tech-Lead'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
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

// Helper function to verify wallet signature (for future enhancement)
// This can be used to verify that the user actually owns the wallet
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signatureBuffer = bs58.decode(signature);
    const messageBuffer = Buffer.from(message);

    // In production, use @solana/web3.js to verify signature
    // For now, we'll skip signature verification
    // This is just a placeholder for future implementation

    return true;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Generate JWT token for authenticated users
export function generateToken(payload: { userId: string; email?: string; wallet_address?: string }): string {
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
  // Method 1: Check wallet header (existing Solana wallet auth)
  const walletAddress = req.headers['x-wallet-address'] as string;
  if (walletAddress) {
    return authenticateWallet(req, res, next);
  }

  // Method 2: Check JWT token (Google auth)
  const token = req.cookies?.auth_token ||
    req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    return authenticateToken(req, res, next);
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Wallet address or authentication token required',
  });
}

// Optional middleware for signature verification
export async function verifySignature(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;
    const signature = req.headers['x-signature'] as string;
    const message = req.headers['x-message'] as string;

    if (!signature || !message) {
      return res.status(401).json({
        error: 'Signature Required',
        message: 'Wallet signature and message are required',
      });
    }

    const isValid = await verifyWalletSignature(walletAddress, signature, message);

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Signature',
        message: 'Wallet signature verification failed',
      });
    }

    next();
  } catch (error: any) {
    console.error('Signature verification error:', error);
    return res.status(500).json({
      error: 'Verification Failed',
      message: error.message,
    });
  }
}
