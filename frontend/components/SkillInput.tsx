import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { AVAILABLE_SKILLS } from '../data/skillsLibrary';
import { clsx } from 'clsx';

interface SkillInputProps {
    skills: string[];
    onChange: (skills: string[]) => void;
    maxSkills?: number;
}

export function SkillInput({ skills, onChange, maxSkills = 5 }: SkillInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const suggestions = inputValue.trim()
        ? AVAILABLE_SKILLS.filter(
            skill =>
                skill.toLowerCase().includes(inputValue.toLowerCase()) &&
                !skills.includes(skill)
        ).slice(0, 8) // Limit to 8 suggestions
        : [];

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addSkill = (skill: string) => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill && !skills.includes(trimmedSkill) && skills.length < maxSkills) {
            onChange([...skills, trimmedSkill]);
        }
        setInputValue('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const removeSkill = (skillToRemove: string) => {
        onChange(skills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                addSkill(suggestions[highlightedIndex]);
            } else if (inputValue.trim()) {
                // Allow adding custom skill if it's in the library or just add it anyway
                const matchedSkill = AVAILABLE_SKILLS.find(
                    s => s.toLowerCase() === inputValue.toLowerCase()
                );
                addSkill(matchedSkill || inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
            // Remove last skill when pressing backspace on empty input
            removeSkill(skills[skills.length - 1]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        } else if (e.key === ',' || e.key === 'Tab') {
            if (inputValue.trim()) {
                e.preventDefault();
                const matchedSkill = AVAILABLE_SKILLS.find(
                    s => s.toLowerCase() === inputValue.toLowerCase()
                );
                addSkill(matchedSkill || inputValue);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Input container with skill tags */}
            <div
                className={clsx(
                    "flex flex-wrap gap-2 p-3 bg-black/30 border border-white/10 min-h-[50px] cursor-text transition-colors",
                    showSuggestions && suggestions.length > 0 && "border-cyber-blue"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Skill tags */}
                {skills.map(skill => (
                    <span
                        key={skill}
                        className="flex items-center gap-1.5 px-2 py-1 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue text-xs font-mono"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeSkill(skill);
                            }}
                            className="hover:bg-cyber-blue/30 rounded p-0.5 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}

                {/* Input field */}
                {skills.length < maxSkills && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => inputValue && setShowSuggestions(true)}
                        placeholder={skills.length === 0 ? "Type to search skills..." : ""}
                        className="flex-1 min-w-[150px] bg-transparent text-white outline-none font-mono text-sm placeholder:text-white/30"
                    />
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-cyber-blue/30 max-h-[200px] overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion}
                            onClick={() => addSkill(suggestion)}
                            className={clsx(
                                "px-3 py-2 text-sm font-mono cursor-pointer transition-colors",
                                index === highlightedIndex
                                    ? "bg-cyber-blue/20 text-cyber-blue"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}

            {/* Helper text removed */}
        </div>
    );
}

export default SkillInput;
