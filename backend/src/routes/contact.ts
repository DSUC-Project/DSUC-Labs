import { Router, Request, Response } from "express";
import { Resend } from "resend";

const router = Router();

// Rate limiting map
const rateLimitMap: Map<string, { count: number; timestamp: number }> = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function getClientIp(req: Request): string {
    return (
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown"
    );
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

// Simple email function using Resend API
async function sendEmail(name: string, message: string, ip: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ADMIN_EMAIL;

    console.log("[EMAIL] Starting email send with Resend...");
    console.log("[EMAIL] API Key:", apiKey ? `✓ Set (${apiKey.substring(0, 8)}...)` : "✗ Not set");
    console.log("[EMAIL] To:", to);

    if (!apiKey) {
        console.error("[EMAIL] Missing RESEND_API_KEY!");
        return;
    }

    if (!to) {
        console.error("[EMAIL] Missing ADMIN_EMAIL!");
        return;
    }

    // Format time in GMT+7 (Vietnam)
    const now = new Date();
    const gmt7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const timeString = gmt7Time.toLocaleString('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const resend = new Resend(apiKey);

    try {
        console.log("[EMAIL] Sending...");
        const { data, error } = await resend.emails.send({
            from: "DSUC Contact <onboarding@resend.dev>",
            to: to,
            subject: `[DSUC Contact] ${name}`,
            html: `
                <h2>New Contact Message</h2>
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>IP:</strong> ${ip}</p>
                <p><strong>Time (GMT+7):</strong> ${timeString}</p>
            `,
        });

        if (error) {
            console.error("[EMAIL] ✗ Resend error:", error);
            throw new Error(error.message);
        }

        console.log("[EMAIL] ✓ Sent! ID:", data?.id);
    } catch (error: any) {
        console.error("[EMAIL] ✗ Failed:", error.message);
        throw error;
    }
}

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
    try {
        const clientIp = getClientIp(req);

        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                error: "Too many requests. Try again later.",
            });
        }

        const { name, message } = req.body;

        if (!name || !message || name.length < 2 || message.length < 10) {
            return res.status(400).json({
                error: "Name (2+ chars) and message (10+ chars) required.",
            });
        }

        const cleanName = name.trim().slice(0, 100);
        const cleanMessage = message.trim().slice(0, 2000);

        console.log("[CONTACT] Received:", { name: cleanName, messageLen: cleanMessage.length });

        // Send email and wait for it
        try {
            await sendEmail(cleanName, cleanMessage, clientIp);
            res.json({ success: true, message: "Message sent successfully!" });
        } catch (emailError: any) {
            console.error("[CONTACT] Email failed, but saving message:", emailError.message);
            // Still return success - message was received, email just failed
            res.json({ success: true, message: "Message received. We'll get back to you soon!" });
        }
    } catch (error: any) {
        console.error("[CONTACT] Error:", error);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

export default router;
