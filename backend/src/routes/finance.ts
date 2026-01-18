import { Router, Request, Response } from "express";
import { db } from "../index";
import {
  authenticateWallet,
  AuthRequest,
  requireAdmin,
} from "../middleware/auth";
import {
  uploadBase64ToSupabase,
  uploadBase64ToImageBB,
} from "../middleware/upload";

const router = Router();

// POST /api/finance/request - Submit new finance request
router.post(
  "/request",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, reason, date, bill_image } = req.body;

      console.log(
        "[POST /api/finance/request] Request from:",
        req.user?.id,
        req.user?.name
      );
      console.log(
        "[POST /api/finance/request] Body:",
        JSON.stringify(req.body, null, 2)
      );

      if (!amount || !reason) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Amount and reason are required",
        });
      }

      const requestData: any = {
        requester_id: req.user!.id,
        requester_name: req.user!.name,
        amount,
        reason,
        date: date || new Date().toISOString().split("T")[0],
        status: "pending",
      };

      console.log(
        "[POST /api/finance/request] Request data before image:",
        JSON.stringify(requestData, null, 2)
      );

      // Handle bill image upload if it's base64
      if (bill_image && bill_image.startsWith("data:image")) {
        try {
          console.log("[finance.ts] Uploading bill image to ImageBB...");
          const uploadedImageUrl = await uploadBase64ToImageBB(bill_image);
          requestData.bill_image = uploadedImageUrl;
          console.log(
            "[finance.ts] Bill image uploaded successfully:",
            uploadedImageUrl
          );
        } catch (uploadError: any) {
          console.error("Bill image upload error:", uploadError);
          return res.status(500).json({
            error: "Upload Error",
            message: `Failed to upload bill image: ${uploadError.message}`,
          });
        }
      } else if (bill_image) {
        requestData.bill_image = bill_image;
      }

      console.log(
        "[POST /api/finance/request] Final request data:",
        JSON.stringify(requestData, null, 2)
      );

      const { data: newRequest, error } = await db
        .from("finance_requests")
        .insert([requestData])
        .select()
        .single();

      console.log("[POST /api/finance/request] Supabase result:", {
        data: newRequest,
        error,
      });

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
          details: error,
        });
      }

      res.status(201).json({
        success: true,
        data: newRequest,
        message: "Finance request submitted successfully",
      });
    } catch (error: any) {
      console.error("Error creating finance request:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// GET /api/finance/pending - Get all pending requests (Admin view)
router.get(
  "/pending",
  authenticateWallet as any,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: requests, error } = await db
        .from("finance_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: requests,
        count: requests?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// GET /api/finance/history - Get all completed/rejected requests
router.get(
  "/history",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: requests, error } = await db
        .from("finance_requests")
        .select("*")
        .in("status", ["completed", "rejected"])
        .order("processed_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: requests,
        count: requests?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching finance history:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// GET /api/finance/my-requests - Get current user's requests
router.get(
  "/my-requests",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: requests, error } = await db
        .from("finance_requests")
        .select("*")
        .eq("requester_id", req.user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: requests,
        count: requests?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// GET /api/finance/request/:id - Get request details with requester bank info
router.get(
  "/request/:id",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Get finance request
      const { data: request, error: requestError } = await db
        .from("finance_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (requestError || !request) {
        return res.status(404).json({
          error: "Not Found",
          message: "Finance request not found",
        });
      }

      // Get requester's bank info
      const { data: requester, error: memberError } = await db
        .from("members")
        .select("bank_info, name")
        .eq("id", request.requester_id)
        .single();

      if (memberError) {
        console.error("Error fetching requester info:", memberError);
      }

      // Combine data
      const responseData = {
        ...request,
        requester_bank_info: requester?.bank_info || null,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error fetching request details:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// POST /api/finance/approve/:id - Approve and complete request (Admin only)
router.post(
  "/approve/:id",
  authenticateWallet as any,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if request exists and is pending
      const { data: request, error: fetchError } = await db
        .from("finance_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !request) {
        return res.status(404).json({
          error: "Not Found",
          message: "Finance request not found",
        });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          error: "Bad Request",
          message: "Request has already been processed",
        });
      }

      // Update status to completed
      const { data: updatedRequest, error } = await db
        .from("finance_requests")
        .update({
          status: "completed",
          processed_by: req.user!.id,
          processed_at: new Date().toISOString(),
        })
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

      // Add to finance_history for public ledger
      const { data: historyData, error: historyError } = await db
        .from("finance_history")
        .insert({
          requester_id: request.requester_id,
          requester_name: request.requester_name,
          amount: request.amount,
          reason: request.reason,
          date: request.date,
          bill_image: request.bill_image,
          status: "completed",
          processed_by: req.user!.id,
          processed_by_name: req.user!.name,
          processed_at: new Date().toISOString(),
        })
        .select();

      if (historyError) {
        console.error("Error adding to finance history:", historyError);
      } else {
        console.log("[approve] Added to finance_history:", historyData);
      }

      res.json({
        success: true,
        data: updatedRequest,
        message: "Request approved successfully",
      });
    } catch (error: any) {
      console.error("Error approving request:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// POST /api/finance/reject/:id - Reject request (Admin only)
router.post(
  "/reject/:id",
  authenticateWallet as any,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if request exists and is pending
      const { data: request, error: fetchError } = await db
        .from("finance_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !request) {
        return res.status(404).json({
          error: "Not Found",
          message: "Finance request not found",
        });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          error: "Bad Request",
          message: "Request has already been processed",
        });
      }

      // Update status to rejected
      const { data: updatedRequest, error } = await db
        .from("finance_requests")
        .update({
          status: "rejected",
          processed_by: req.user!.id,
          processed_at: new Date().toISOString(),
        })
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

      // Add to finance_history for public ledger
      const { data: historyData, error: historyError } = await db
        .from("finance_history")
        .insert({
          requester_id: request.requester_id,
          requester_name: request.requester_name,
          amount: request.amount,
          reason: request.reason,
          date: request.date,
          bill_image: request.bill_image,
          status: "rejected",
          processed_by: req.user!.id,
          processed_by_name: req.user!.name,
          processed_at: new Date().toISOString(),
        })
        .select();

      if (historyError) {
        console.error("Error adding to finance history:", historyError);
      } else {
        console.log("[reject] Added to finance_history:", historyData);
      }

      res.json({
        success: true,
        data: updatedRequest,
        message: "Request rejected successfully",
      });
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// GET /api/finance/members-with-bank - Get members who have bank info (for Direct Transfer)
router.get(
  "/members-with-bank",
  authenticateWallet as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: members, error } = await db
        .from("members")
        .select("id, name, avatar, role, bank_info")
        .eq("is_active", true)
        .not("bank_info", "is", null);

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({
          error: "Database Error",
          message: error.message,
        });
      }

      // Filter members who actually have bank account number
      const membersWithBank =
        members?.filter(
          (member: any) => member.bank_info && member.bank_info.accountNo
        ) || [];

      res.json({
        success: true,
        data: membersWithBank,
        count: membersWithBank.length,
      });
    } catch (error: any) {
      console.error("Error fetching members with bank info:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

export default router;
