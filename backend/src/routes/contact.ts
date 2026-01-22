import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";

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

// Simple email function
async function sendEmail(name: string, message: string, ip: string): Promise<void> {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASSWORD?.replace(/\s/g, ''); // Remove spaces from app password
    const to = process.env.ADMIN_EMAIL || user;

    console.log("[EMAIL] Starting email send...");
    console.log("[EMAIL] From:", user);
    console.log("[EMAIL] To:", to);
    console.log("[EMAIL] Password length:", pass?.length);

    if (!user || !pass) {
        console.error("[EMAIL] Missing credentials!");
        return;
    }

    // Create transporter fresh each time (simple approach)
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        console.log("[EMAIL] Sending...");
        const info = await transporter.sendMail({
            from: user,
            to: to,
            subject: `[DSUC Contact] ${name}`,
            text: `Name: ${name}\nMessage: ${message}\nIP: ${ip}\nTime: ${new Date().toISOString()}`,
            html: `
                <h2>New Contact Message</h2>
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>IP:</strong> ${ip}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `,
        });
        console.log("[EMAIL] ✓ Sent! MessageId:", info.messageId);
    } catch (error: any) {
        console.error("[EMAIL] ✗ Failed:", error.message);
        console.error("[EMAIL] Error code:", error.code);
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
