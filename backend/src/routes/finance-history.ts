import { Router, Request, Response } from "express";
import { db } from "../index";
import {
  authenticateWallet,
  requireAdmin,
} from "../middleware/auth";

const router = Router();

// GET /api/finance-history - Get all finance history (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { data: history, error } = await db
      .from("finance_history")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Database Error",
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: history || [],
      count: history?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching finance history:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

// POST /api/finance-history - Add to history (when request is approved/rejected)
// This should be called by admin when processing finance requests
router.post(
  "/",
  authenticateWallet as any,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        requester_id,
        requester_name,
        amount,
        reason,
        date,
        bill_image,
        status,
      } = req.body;

      if (!requester_id || !requester_name || !amount || !status) {
        return res.status(400).json({
          error: "Bad Request",
          message:
            "requester_id, requester_name, amount, and status are required",
        });
      }

      if (!["completed", "rejected"].includes(status)) {
        return res.status(400).json({
          error: "Bad Request",
          message: 'status must be either "completed" or "rejected"',
        });
      }

      const { data: history, error } = await db
        .from("finance_history")
        .insert({
          requester_id,
          requester_name,
          amount,
          reason,
          date,
          bill_image,
          status,
          processed_by: req.user!.id,
          processed_by_name: req.user!.name,
          processed_at: new Date().toISOString(),
        })
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
        data: history,
        message: "Finance record added to history",
      });
    } catch (error: any) {
      console.error("Error adding finance history:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

export default router;
