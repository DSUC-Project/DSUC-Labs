import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Github,
  Twitter,
  Send,
  Shield,
  Globe,
  Facebook,
  X,
  Mail,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Member } from "../types";
import { ActionButton, SoftBrutalCard } from "@/components/ui/Primitives";
import { ModalShell } from "@/components/ui/ModalShell";

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members } = useStore();
  const [showContactPopup, setShowContactPopup] = useState(false);

  const displayMembers = members;

  const member = displayMembers.find((m) => m.id === id) || {
    id: id || "mock-id",
    name: "User " + (id?.substring(0, 4) || "X"),
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    role: "Member",
    memberType: "community",
    skills: [],
    socials: {},
    streak: 0,
  };

  const isCommunity = member?.memberType === "community";

  if (!member && displayMembers.length > 0) {
    return (
      <div className="text-text-muted text-center pt-20 font-mono text-sm uppercase">
        Member not found
      </div>
    );
  }

  const handleContactSelect = (platform: string, url: string) => {
    window.open(url, "_blank");
    setShowContactPopup(false);
  };

  return (
    <div className="container mx-auto pt-10 px-4 sm:px-6 pb-20 space-y-12">
      <button
        onClick={() => navigate("/members")}
        className="inline-flex items-center gap-2 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        BACK TO MEMBERS
      </button>

      {/* Contact Popup */}
      <ModalShell
        isOpen={showContactPopup}
        onClose={() => setShowContactPopup(false)}
        title="Connect"
        label="CONTACT INFO"
      >
        <div className="space-y-4">
          {member.email && (
            <button
              onClick={() =>
                handleContactSelect("email", `mailto:${member.email}`)
              }
              className="w-full flex items-center gap-4 bg-surface hover:bg-main-bg  p-4 transition-all group"
            >
              <Mail
                className="text-text-muted group-hover:text-primary transition-colors"
                size={20}
              />
              <span className="font-mono text-xs text-text-main uppercase tracking-wider">
                Email
              </span>
            </button>
          )}
          {member.socials?.telegram && (
            <button
              onClick={() =>
                handleContactSelect(
                  "telegram",
                  member.socials.telegram!.startsWith("http")
                    ? member.socials.telegram!
                    : `https://t.me/${member.socials.telegram}`,
                )
              }
              className="w-full flex items-center gap-4 bg-surface hover:bg-main-bg border border-border-main p-4 transition-all group"
            >
              <Send
                className="text-text-muted group-hover:text-primary transition-colors"
                size={20}
              />
              <span className="font-mono text-xs text-text-main uppercase tracking-wider">
                Telegram
              </span>
            </button>
          )}
          {member.socials?.twitter && (
            <button
              onClick={() =>
                handleContactSelect(
                  "twitter",
                  member.socials.twitter!.startsWith("http")
                    ? member.socials.twitter!
                    : `https://x.com/${member.socials.twitter}`,
                )
              }
              className="w-full flex items-center gap-4 bg-surface hover:bg-main-bg border border-border-main p-4 transition-all group"
            >
              <Twitter
                className="text-text-muted group-hover:text-primary transition-colors"
                size={20}
              />
              <span className="font-mono text-xs text-text-main uppercase tracking-wider">
                Twitter / X
              </span>
            </button>
          )}
          {member.socials?.facebook && (
            <button
              onClick={() =>
                handleContactSelect(
                  "facebook",
                  member.socials.facebook!.startsWith("http")
                    ? member.socials.facebook!
                    : `https://facebook.com/${member.socials.facebook}`,
                )
              }
              className="w-full flex items-center gap-4 bg-surface hover:bg-main-bg border border-border-main p-4 transition-all group"
            >
              <Facebook
                className="text-text-muted group-hover:text-primary transition-colors"
                size={20}
              />
              <span className="font-mono text-xs text-text-main uppercase tracking-wider">
                Facebook
              </span>
            </button>
          )}

          {!member.email &&
            !member.socials?.telegram &&
            !member.socials?.twitter &&
            !member.socials?.facebook && (
              <div className="text-center text-text-muted font-mono text-xs p-6 border border-border-main bg-main-bg uppercase">
                No contact info provided.
              </div>
            )}
        </div>
      </ModalShell>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Avatar & Basic Stats */}
        <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center group relative z-10 w-full">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-64 h-64 mb-10 mx-auto"
          >
            <div className="absolute inset-0 bg-surface shadow-[4px_4px_0_0_#1a1b26] z-10 transition-transform duration-500 p-2 border border-border-main">
              <img
                src={
                  member.avatar || `https://i.pravatar.cc/150?u=${member.id}`
                }
                alt={member.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 border border-border-main"
              />
            </div>

            {(member as any).streak > 0 && (
              <div className="absolute top-4 -left-4 flex items-center gap-1 bg-surface text-text-main border-2 px-3 py-1 font-mono text-xs font-bold uppercase z-20 border-text-main shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                {(member as any).streak} days <span className="ml-1">🔥</span>
              </div>
            )}
          </motion.div>

          <div className="w-full space-y-4 max-w-sm mx-auto">
            <SoftBrutalCard className="p-4 flex justify-between items-center relative overflow-hidden group/item">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-widest mb-1">
                  Role
                </span>
                <span className="text-text-main text-lg font-heading font-black uppercase tracking-tight">
                  {member.role || "Member"}
                </span>
              </div>
              <Shield className="text-text-muted w-6 h-6 group-hover/item:text-primary transition-colors" />
            </SoftBrutalCard>

            <SoftBrutalCard className="p-4 flex justify-between items-center relative overflow-hidden group/item">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase font-mono tracking-widest mb-1">
                  Status
                </span>
                <span className="text-emerald-500 text-lg font-heading font-black tracking-tight uppercase">
                  ONLINE
                </span>
              </div>
              <Globe className="text-emerald-500 w-6 h-6 animate-pulse" />
            </SoftBrutalCard>
          </div>
        </div>

        {/* Right Column: Detailed Dossier */}
        <div className="md:col-span-8 lg:col-span-8 space-y-10 relative z-10">
          <div className=" pb-8 relative">
            <motion.h1
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-text-main mb-6 uppercase tracking-tighter"
            >
              {member.name}
            </motion.h1>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <div className="bg-primary text-main-bg px-3 py-1 font-mono tracking-widest uppercase text-[10px] border border-border-main">
                {member.role || "Member"}
              </div>
              <div className="px-3 py-1 bg-surface border border-border-main font-mono text-text-muted uppercase text-[10px]">
                ID: {member.id || "CLASSIFIED"}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <SoftBrutalCard className="p-8">
              <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-primary" /> Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-3">
                {member.skills?.length > 0 ? (
                  member.skills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="px-3 py-1 border border-border-main bg-main-bg text-text-main font-mono text-[10px] uppercase cursor-default"
                    >
                      {skill}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-text-muted font-mono text-[10px] uppercase border border-border-main bg-main-bg px-3 py-1">
                    No skills added.
                  </span>
                )}
              </div>
            </SoftBrutalCard>

            <SoftBrutalCard className="p-8">
              <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-2 h-2 bg-highlight" /> Social Links
              </h3>
              <div className="flex flex-wrap gap-4">
                {member.socials?.github ? (
                  <a
                    href={
                      member.socials.github.startsWith("http")
                        ? member.socials.github
                        : `https://github.com/${member.socials.github}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 flex items-center justify-center border border-border-main hover:bg-main-bg text-text-main transition-colors bg-surface"
                  >
                    <Github size={20} />
                  </a>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center border border-border-main  bg-main-bg text-text-muted opacity-50">
                    <Github size={20} />
                  </div>
                )}
                {member.socials?.twitter ? (
                  <a
                    href={
                      member.socials.twitter.startsWith("http")
                        ? member.socials.twitter
                        : `https://twitter.com/${member.socials.twitter}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 flex items-center justify-center border border-border-main hover:bg-main-bg text-text-main transition-colors bg-surface"
                  >
                    <Twitter size={20} />
                  </a>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center border border-border-main border-dashed bg-main-bg text-text-muted opacity-50">
                    <Twitter size={20} />
                  </div>
                )}
                {member.socials?.telegram ? (
                  <a
                    href={
                      member.socials.telegram.startsWith("http")
                        ? member.socials.telegram
                        : `https://t.me/${member.socials.telegram}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 flex items-center justify-center border border-border-main hover:bg-main-bg text-text-main transition-colors bg-surface"
                  >
                    <Send size={20} />
                  </a>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center border border-border-main border-dashed bg-main-bg text-text-muted opacity-50">
                    <Send size={20} />
                  </div>
                )}
                {member.socials?.facebook ? (
                  <a
                    href={
                      member.socials.facebook.startsWith("http")
                        ? member.socials.facebook
                        : `https://facebook.com/${member.socials.facebook}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 flex items-center justify-center border border-border-main hover:bg-main-bg text-text-main transition-colors bg-surface"
                  >
                    <Facebook size={20} />
                  </a>
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center border border-border-main border-dashed bg-main-bg text-text-muted opacity-50">
                    <Facebook size={20} />
                  </div>
                )}
              </div>
            </SoftBrutalCard>
          </div>

          <div className="pt-8 flex justify-end">
            <ActionButton
              variant="primary"
              onClick={() => setShowContactPopup(true)}
              className="w-full sm:w-auto min-w-[200px]"
            >
              <span className="flex items-center justify-center gap-2">
                <Mail size={16} /> Connect
              </span>
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
