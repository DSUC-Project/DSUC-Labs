import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import membersRouter from "./routes/members";
import projectsRouter from "./routes/projects";
import eventsRouter from "./routes/events";
import financeRouter from "./routes/finance";
import workRouter from "./routes/work";
import resourcesRouter from "./routes/resources";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in env");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

app.use("/api/members", membersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/finance", financeRouter);
app.use("/api/work", workRouter);
app.use("/api/resources", resourcesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
