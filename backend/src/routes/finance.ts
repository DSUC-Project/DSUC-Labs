import { Router } from "express";
import { supabase } from "../index";
import upload from "../middleware/upload";

const router = Router();

// POST /api/finance/request (accepts optional file field 'file')
router.post("/request", upload.single("file"), async (req, res) => {
  const payload = req.body;
  try {
    if (req.file) {
      const bucket = process.env.SUPABASE_BILL_BUCKET || "bills";
      const fileName = `${payload.requester_id || "anon"}_${Date.now()}`;
      const { data: upData, error: upError } = await supabase.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
      if (upError) return res.status(500).json({ error: upError });
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(upData.path);
      payload.bill_image = publicData.publicUrl;
    }

    const { data, error } = await supabase
      .from("finance_requests")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/finance/pending
router.get("/pending", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("finance_requests")
      .select("*")
      .eq("status", "pending");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST approve
router.post("/approve/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("finance_requests")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST reject
router.post("/reject/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("finance_requests")
      .update({ status: "rejected" })
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET history
router.get("/history", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("finance_requests")
      .select("*")
      .neq("status", "pending");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
