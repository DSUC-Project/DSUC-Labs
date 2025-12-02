import { Request, Response, NextFunction } from 'express';
import { supabase } from '../index';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    wallet_address: string;
    name: string;
    role: string;
    avatar?: string;
    skills?: string[];
    socials?: any;
    bank_info?: any;
  };
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

    // Validate Solana address format
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Wallet',
        message: 'Invalid Solana wallet address format',
      });
    }

    // Query member from database
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('is_active', true)
      .single();

    if (error || !member) {
      return res.status(404).json({
        error: 'Member Not Found',
        message: 'Wallet address not registered in the system',
      });
    }

    // Attach user info to request
    req.user = member;
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
