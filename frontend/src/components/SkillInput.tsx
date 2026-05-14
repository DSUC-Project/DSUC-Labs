import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";

export function SkillInput({
  skills,
  onChange,
  maxSkills = 5,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    if (skills.length >= maxSkills) return;

    const newSkill = inputValue.trim().toUpperCase();
    if (!skills.includes(newSkill)) {
      onChange([...skills, newSkill]);
    }
    setInputValue("");
  };

  const handleRemove = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((skill) => (
            <motion.div
              key={skill}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="group flex items-center gap-2 bg-main-bg  px-3 py-1.5 shadow-sm hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-md-none transition-all"
            >
              <span className="font-mono text-xs font-bold uppercase text-text-main">
                {skill}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(skill)}
                className="text-text-muted hover:text-red-500 transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {skills.length < maxSkills && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Add a skill (max ${maxSkills})`}
            className="flex-1 bg-surface border border-border-main px-4 py-2 font-mono text-sm placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            maxLength={20}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-primary text-main-bg border border-border-main px-4 py-2 shadow-sm hover:shadow-md-none hover:translate-y-[1px] hover:translate-x-[1px] transition-all disabled:opacity-50 flex items-center justify-center font-bold"
          >
            <Plus size={20} />
          </button>
        </form>
      )}
      {skills.length >= maxSkills && (
        <p className="text-text-muted text-xs font-mono uppercase">
          Maximum skills reached ({maxSkills}/{maxSkills})
        </p>
      )}
    </div>
  );
}
