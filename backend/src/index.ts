import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { USE_MOCK_DB } from "./config/runtime";
import { db } from "./db";

// Import routes
import memberRoutes from "./routes/members";
import projectRoutes from "./routes/projects";
import eventRoutes from "./routes/events";
import financeRoutes from "./routes/finance";
import workRoutes from "./routes/work";
import resourceRoutes from "./routes/resources";
import authRoutes from "./routes/auth";
import financeHistoryRoutes from "./routes/finance-history";
import contactRoutes from "./routes/contact";
import academyRoutes from "./routes/academy";
import adminRoutes from "./routes/admin";

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://dsuc.fun",
  "https://www.dsuc.fun",
  "https://dsuc-labs-xmxl.onrender.com",
  "https://www.dsuc-labs-xmxl.onrender.com",
  process.env.ADMIN_FRONTEND_URL,
].filter((origin): origin is string => typeof origin === "string");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

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
app.use("/api/finance-history", financeHistoryRoutes);
app.use("/api/work", workRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/admin", adminRoutes);

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
║   Database: ${USE_MOCK_DB ? 'Mock Data (Local)' : 'Supabase (Production)'}   ║
║   Status: ONLINE ✓                        ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
