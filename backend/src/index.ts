import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Import routes
import memberRoutes from "./routes/members";
import projectRoutes from "./routes/projects";
import eventRoutes from "./routes/events";
import financeRoutes from "./routes/finance";
import workRoutes from "./routes/work";
import resourceRoutes from "./routes/resources";
import authRoutes from "./routes/auth";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Middleware
app.use(
  cors({
    origin: [
      "https://dsuc.fun",
      "https://www.dsuc.fun",
      "https://dsuc-labs-xmxl.onrender.com",
      "https://www.dsuc-labs-xmxl.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "DSUC Lab Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/members", memberRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/work", workRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   DSUC Lab Backend Server                 ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || "development"}              ║
║   Status: ONLINE ✓                        ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
