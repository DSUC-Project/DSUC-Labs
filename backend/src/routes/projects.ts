import { Router } from "express";
import { supabase } from "../index";

const router = Router();

// GET /api/projects
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects
router.post("/", async (req, res) => {
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(404).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
