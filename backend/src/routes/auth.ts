import { Router, Request, Response } from "express";
import { db } from "../index";

const router = Router();

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

export default router;
