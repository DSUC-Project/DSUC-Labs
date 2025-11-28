import { Router } from "express";
import { supabase } from "../index";

const router = Router();

// Bounties
router.get("/bounties", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("bounties").select("*");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/bounties", async (req, res) => {
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("bounties")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Repos
router.get("/repos", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("repos").select("*");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/repos", async (req, res) => {
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("repos")
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
