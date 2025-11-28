import { Router, Request, Response } from "express";
import { supabase } from "../index";
import upload from "../middleware/upload";

const router = Router();

// Wallet auth: POST /api/members/auth/wallet
// Body: { wallet_address }
// Behavior: only allow login if wallet_address already exists in members table.
router.post("/auth/wallet", async (req: Request, res: Response) => {
  const { wallet_address } = req.body;
  if (!wallet_address)
    return res.status(400).json({ error: "wallet_address required" });
  try {
    const { data: existing, error } = await supabase
      .from("members")
      .select("*")
      .eq("wallet_address", wallet_address)
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error });

    if (existing) return res.json(existing);

    // If wallet not found, deny login
    return res
      .status(403)
      .json({ error: "You can't login because you are not club's member !" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin-only register endpoint to add allowed wallet addresses (enforces max 15 members)
// POST /api/members/register
// Headers: x-admin-key: <ADMIN_KEY>  OR body.admin_key
// Body: { wallet_address, name?, role? }
router.post("/register", async (req: Request, res: Response) => {
  const adminKey = (req.headers["x-admin-key"] as string) || req.body.admin_key;
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: "Unauthorized" });

  const { wallet_address, name, role } = req.body;
  if (!wallet_address)
    return res.status(400).json({ error: "wallet_address required" });

  try {
    // count current members
    const { data: members } = await supabase.from("members").select("id");
    const currentCount = Array.isArray(members) ? members.length : 0;
    if (currentCount >= 15)
      return res.status(400).json({ error: "Member limit reached (15)" });

    // check existing
    const { data: existing } = await supabase
      .from("members")
      .select("*")
      .eq("wallet_address", wallet_address)
      .limit(1)
      .maybeSingle();

    if (existing)
      return res.status(409).json({ error: "Wallet already registered" });

    const payload: any = { wallet_address };
    if (name) payload.name = name;
    if (role) payload.role = role;

    const { data, error } = await supabase
      .from("members")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET by wallet
router.get("/by-wallet/:wallet", async (req: Request, res: Response) => {
  const { wallet } = req.params;
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("wallet_address", wallet)
      .limit(1)
      .maybeSingle();
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/members
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("members").select("*");
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/members/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(404).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/members/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const { data, error } = await supabase
      .from("members")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/members/:id/avatar - upload avatar file to Supabase Storage
router.post(
  "/:id/avatar",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    // @ts-ignore - multer adds file
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const bucket = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
    const fileName = `${id}_${Date.now()}`;
    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
      if (uploadError) return res.status(500).json({ error: uploadError });

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      const avatarUrl = publicData.publicUrl;

      const { data: updated, error: updateError } = await supabase
        .from("members")
        .update({ avatar: avatarUrl })
        .eq("id", id)
        .select()
        .single();
      if (updateError) return res.status(500).json({ error: updateError });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
