import { Router } from "express";
import { supabase } from "../index";

const router = Router();

// GET /api/events
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events
router.post("/", async (req, res) => {
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
