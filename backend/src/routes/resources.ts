import { Router } from "express";
import { supabase } from "../index";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("resources").select("*");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("resources")
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
