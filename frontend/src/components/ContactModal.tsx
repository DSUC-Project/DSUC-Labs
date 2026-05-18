import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle, X, Users, Handshake } from "lucide-react";
import { useStore } from "../store/useStore";
import { useLocale } from "@/lib/locale";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactFormData {
  name: string;
  message: string;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { text } = useLocale();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { members } = useStore();
  const president = members.find((m) => m.role === "President");

  const socialLinks = [
    {
      name: "Telegram",
      icon: MessageCircle,
      url: "https://t.me/dsuc",
      color: "hover:bg-primary hover:text-white",
    },
    {
      name: "X",
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-[18px] h-[18px]"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: "https://x.com/superteamdut",
      color: "hover:bg-text-main hover:text-white",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      url: "https://facebook.com/superteamdut.club",
      color: "hover:bg-pink-400 hover:text-text-main",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ContactModal] Form submitted", {
      name: formData.name,
      messageLength: formData.message.length,
    });

    if (!formData.name.trim() || !formData.message.trim()) {
      console.warn("[ContactModal] Validation failed - missing fields");
      setErrorMessage(
        text(
          "Please fill in your name and message",
          "Vui lòng nhập tên và nội dung tin nhắn",
        ),
      );
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
      return;
    }

    setIsLoading(true);
    const base =
      (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:3001";
    console.log("[ContactModal] API endpoint:", base);

    try {
      console.log("[ContactModal] Sending POST request to /api/contact...");
      const response = await fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("[ContactModal] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[ContactModal] ✓ Success response:", data);
        setSubmitStatus("success");
        setFormData({ name: "", message: "" });
        setTimeout(() => {
          console.log("[ContactModal] Closing modal after success");
          setSubmitStatus("idle");
          onClose();
        }, 3500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[ContactModal] ✗ Error response:", {
          status: response.status,
          error: errorData,
        });

        // Set specific error messages based on status code
        if (response.status === 429) {
          setErrorMessage(
            text(
              "Too many messages. Please wait an hour before sending another.",
              "Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ khoảng một giờ rồi thử lại.",
            ),
          );
        } else if (response.status === 400) {
          setErrorMessage(
            text(
              "Invalid message. Please check your input.",
              "Nội dung tin nhắn chưa hợp lệ. Vui lòng kiểm tra lại.",
            ),
          );
        } else if (response.status === 500) {
          setErrorMessage(
            text(
              "Server error. Please try again later.",
              "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.",
            ),
          );
        } else {
          setErrorMessage(
            text(
              "Failed to send your message. Please try again.",
              "Gửi tin nhắn không thành công. Vui lòng thử lại.",
            ),
          );
        }

        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 4000);
      }
    } catch (error) {
      console.error("[ContactModal] ✗ Fetch error:", error);
      setErrorMessage(
        text(
          "Network error. Please check your connection and try again.",
          "Lỗi mạng. Vui lòng kiểm tra kết nối rồi thử lại.",
        ),
      );
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 4000);
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({ name: "", message: "" });
    setSubmitStatus("idle");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border-4 border-text-main bg-white shadow-md-xl md:flex-row"
      >
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-400/95 p-6 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center -black bg-white text-text-main shadow-md">
              <Send size={34} strokeWidth={3} />
            </div>
            <h4 className="font-display text-3xl font-black uppercase tracking-tight text-text-main">
              {text("Message sent", "Đã gửi tin nhắn")}
            </h4>
            <p className="mt-3 max-w-md border-4 border-text-main bg-white px-4 py-3 text-sm font-bold text-text-main shadow-sm">
              {text(
                "DSUC received your note. We will get back to you as soon as possible.",
                "DSUC đã nhận được liên hệ của bạn. Chúng tôi sẽ phản hồi sớm nhất có thể.",
              )}
            </p>
          </motion.div>
        )}

        {president && (
          <div className="relative flex w-full flex-col -4 -black bg-accent md:w-[340px] md:-0 md:-4">
            <div className="p-8">
              <div className="mb-6 inline-flex items-center gap-2 -black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-main shadow-sm">
                <Handshake size={14} />
                {text("Direct Contact", "Liên hệ trực tiếp")}
              </div>
              <div className="-black bg-white p-4 shadow-md">
                <div className="aspect-square overflow-hidden -black bg-pink-400">
                  <img
                    src={president.avatar}
                    alt={president.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-display text-3xl font-black uppercase tracking-tight text-text-main">
                  {president.name}
                </h4>
                <p className="mt-3 inline-block border-2 border-text-main bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-text-main shadow-sm">
                  {president.role || "President"}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {president.socials?.telegram && (
                  <a
                    href={president.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center border-4 border-text-main bg-white text-text-main shadow-sm transition-all hover:-translate-y-1 hover:bg-primary hover:text-white"
                  >
                    <MessageCircle size={18} />
                  </a>
                )}
                {president.socials?.twitter && (
                  <a
                    href={president.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center border-4 border-text-main bg-white text-text-main shadow-sm transition-all hover:-translate-y-1 hover:bg-text-main hover:text-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-[18px] w-[18px]"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {president.socials?.facebook && (
                  <a
                    href={president.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center border-4 border-text-main bg-white text-text-main shadow-sm transition-all hover:-translate-y-1 hover:bg-pink-400 hover:text-text-main"
                  >
                    <FacebookIcon />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto p-8 ">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 border-2 border-transparent p-2 text-text-main transition-colors hover:border-text-main hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X size={20} />
          </button>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 -black bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
              <Users size={14} />
              {text("DSUC Contact", "Liên hệ DSUC")}
            </div>
            <h3 className="font-display text-4xl font-black uppercase tracking-tight text-text-main">
              {text("Contact Us", "Liên hệ với chúng tôi")}
            </h3>
            <p className="mt-4 border-l-4 border-pink-400 pl-4 text-sm font-bold text-text-main">
              {text(
                "Send a message to ask about events, partnerships, collaborations, or anything else you want to discuss with DSUC.",
                "Gửi tin nhắn để hỏi về sự kiện, partnership, collaboration hoặc bất kỳ điều gì bạn muốn trao đổi với DSUC.",
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-widest text-text-main">
                {text("Your Name", "Tên của bạn")}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={text("Example: Danh", "Ví dụ: Danh")}
                className="w-full border-4 border-text-main bg-white px-4 py-3 text-sm font-bold text-text-main outline-none transition-colors focus:bg-accent/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="relative space-y-2">
              <label className="ml-1 text-xs font-black uppercase tracking-widest text-text-main">
                {text("Message", "Nội dung")}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={text(
                  "What would you like DSUC to help with?",
                  "Bạn cần DSUC hỗ trợ gì?",
                )}
                className="h-40 w-full resize-none border-4 border-text-main bg-white px-4 py-3 pr-16 text-sm font-bold text-text-main outline-none transition-colors focus:bg-accent/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                required
                minLength={10}
                maxLength={2000}
              />
              <span className="absolute bottom-4 right-4 border-2 border-text-main bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                {formData.message.length}/2000
              </span>
            </div>

            {submitStatus === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-4 border-text-main bg-red-500 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex min-h-14 w-full items-center justify-center gap-3 border-4 border-text-main bg-accent px-6 py-4 text-sm font-black uppercase tracking-widest text-text-main shadow-md transition-all hover:-translate-y-1 hover:bg-primary hover:text-white hover:shadow-lg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Send size={16} />
              {isLoading
                ? text("Sending...", "Đang gửi...")
                : text("Send Message", "Gửi tin nhắn")}
            </button>
          </form>

          <div className="mt-8 -4 -black pt-6">
            <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-text-main">
              {text(
                "Or connect through social channels",
                "Hoặc kết nối qua các kênh mạng xã hội",
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex min-h-12 items-center gap-2 border-4 border-text-main bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-text-main shadow-sm transition-all hover:-translate-y-1 ${social.color}`}
                  >
                    <Icon size={18} />
                    {social.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
