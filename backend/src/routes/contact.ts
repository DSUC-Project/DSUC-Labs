import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";

const router = Router();

// Initialize email transporter
let transporter: any = null;

function initializeTransporter() {
    console.log("[CONTACT] Initializing transporter...");
    console.log("[CONTACT] GMAIL_USER env:", process.env.GMAIL_USER ? `✓ Set to ${process.env.GMAIL_USER.substring(0, 5)}...` : "✗ Not set");
    console.log("[CONTACT] GMAIL_PASSWORD env:", process.env.GMAIL_PASSWORD ? `✓ Set (${process.env.GMAIL_PASSWORD.length} chars)` : "✗ Not set");
    console.log("[CONTACT] ADMIN_EMAIL env:", process.env.ADMIN_EMAIL ? `✓ Set to ${process.env.ADMIN_EMAIL}` : "✗ Not set");

    // Debug: Log all env vars that start with GMAIL or ADMIN
    console.log("[CONTACT] All environment variables with GMAIL/ADMIN:");
    Object.keys(process.env).forEach(key => {
        if (key.includes("GMAIL") || key.includes("ADMIN")) {
            console.log(`[CONTACT]   ${key}: ${process.env[key]?.substring(0, 10)}...`);
        }
    });

    if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
        console.log("[CONTACT] ✓ Credentials present, creating transporter...");
        console.log("[CONTACT] Transporter config - service: gmail, user:", process.env.GMAIL_USER);
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD,
            },
        });
        console.log("[CONTACT] ✓ Transporter created successfully");
    } else {
        console.log("[CONTACT] ✗ Transporter NOT created!");
        console.log("[CONTACT] Reason: transporter exists?", !!transporter);
        console.log("[CONTACT] GMAIL_USER exists?", !!process.env.GMAIL_USER);
        console.log("[CONTACT] GMAIL_PASSWORD exists?", !!process.env.GMAIL_PASSWORD);
    }
    return transporter;
}

// Store for rate limiting (IP -> count + timestamp)
const rateLimitMap: Map<string, { count: number; timestamp: number }> = new Map();

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX = 5; // Max 5 messages per hour per IP

// Helper to get client IP
function getClientIp(req: Request): string {
    return (
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown"
    );
}

// Helper to check rate limit
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    // Reset if time window has passed
    if (now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    // Check if limit exceeded
    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    // Increment counter
    record.count++;
    return true;
}

// Helper to sanitize input
function sanitizeInput(input: string): string {
    return input
        .trim()
        .slice(0, 2000) // Max length
        .replace(/[<>]/g, "") // Remove angle brackets
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+=/gi, ""); // Remove event handlers
}

// POST /api/contact - Submit contact message
router.post("/", async (req: Request, res: Response) => {
    try {
        const clientIp = getClientIp(req);

        // Check rate limit
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                error: "Too Many Requests",
                message:
                    "You have exceeded the rate limit. Please try again later.",
            });
        }

        const { name, message } = req.body;

        // Validate inputs
        if (!name || !message) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Name and message are required.",
            });
        }

        // Validate lengths
        if (
            typeof name !== "string" ||
            typeof message !== "string" ||
            name.length < 2 ||
            name.length > 100 ||
            message.length < 10 ||
            message.length > 2000
        ) {
            return res.status(400).json({
                error: "Bad Request",
                message:
                    "Invalid input. Name must be 2-100 characters, message must be 10-2000 characters.",
            });
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedMessage = sanitizeInput(message);

        // Log the message
        console.log("[CONTACT] New message received:", {
            name: sanitizedName,
            message: sanitizedMessage,
            ip: clientIp,
            timestamp: new Date().toISOString(),
        });

        // Send response immediately
        res.status(200).json({
            success: true,
            message: "Message received. We'll get back to you soon!",
        });

        // Send email notification asynchronously (non-blocking)
        const emailTransporter = initializeTransporter();
        if (emailTransporter) {
            console.log("[CONTACT] ✓ Email transporter ready, preparing to send...");
            console.log("[CONTACT] Email from:", process.env.GMAIL_USER);
            console.log("[CONTACT] Email to:", process.env.ADMIN_EMAIL || process.env.GMAIL_USER);
            console.log("[CONTACT] Email subject: New Contact Message from", sanitizedName);
            console.log("[CONTACT] Email body length:", sanitizedMessage.length, "chars");

            // Set a timeout for email sending (don't wait more than 10 seconds)
            const emailPromise = emailTransporter.sendMail({
                from: process.env.GMAIL_USER || "noreply@dsuclab.com",
                to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "",
                subject: `New Contact Message from ${sanitizedName}`,
                html: `
                    <h2>New Contact Message</h2>
                    <p><strong>From:</strong> ${sanitizedName}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>IP Address:</strong> ${clientIp}</p>
                    <hr />
                    <p><strong>Message:</strong></p>
                    <p>${sanitizedMessage.replace(/\n/g, "<br />")}</p>
                `,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Email send timeout")), 10000)
            );

            Promise.race([emailPromise, timeoutPromise])
                .then((info: any) => {
                    console.log("[CONTACT] ✓ Email sent successfully!");
                    console.log("[CONTACT] Response ID:", info?.response);
                    console.log("[CONTACT] MessageID:", info?.messageId);
                })
                .catch((error: any) => {
                    console.error("[CONTACT] ✗ Email send failed:", error.message);
                    console.error("[CONTACT] Error code:", error.code);
                    console.error("[CONTACT] Error details:", {
                        code: error.code,
                        errno: error.errno,
                        syscall: error.syscall,
                        hostname: error.hostname,
                        command: error.command,
                    });
                    console.error("[CONTACT] Full error object:", JSON.stringify(error, null, 2));
                });
        } else {
            console.error("[CONTACT] ✗ Email transporter is NULL!");
            console.error("[CONTACT] Could not initialize transporter. Check:");
            console.error("[CONTACT]   1. GMAIL_USER env var set?", !!process.env.GMAIL_USER);
            console.error("[CONTACT]   2. GMAIL_PASSWORD env var set?", !!process.env.GMAIL_PASSWORD);
            console.error("[CONTACT]   3. Is the app password correct (16 chars)?");
            console.error("[CONTACT]   4. Does the Gmail account have 2FA enabled?");
        }
    } catch (error: any) {
        console.error("[CONTACT] Error:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to process your message. Please try again later.",
        });
    }
});

export default router;
