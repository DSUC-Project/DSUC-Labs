import { Router, Request, Response } from "express";

const router = Router();

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

        // TODO: Store message in database or send email notification
        // For now, just log it
        console.log("[CONTACT] New message received:", {
            name: sanitizedName,
            message: sanitizedMessage,
            ip: clientIp,
            timestamp: new Date().toISOString(),
        });

        return res.status(200).json({
            success: true,
            message: "Message received. We'll get back to you soon!",
        });
    } catch (error: any) {
        console.error("[CONTACT] Error:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to process your message. Please try again later.",
        });
    }
});

export default router;
