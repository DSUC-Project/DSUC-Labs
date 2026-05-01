import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { AVAILABLE_SKILLS } from '@/data/skillsLibrary';

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

  const suggestions = inputValue.trim()
    ? AVAILABLE_SKILLS.filter(
        (skill) =>
          skill.toLowerCase().includes(inputValue.toLowerCase()) && !skills.includes(skill)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    onChange(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addSkill(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        const matchedSkill = AVAILABLE_SKILLS.find(
          (skill) => skill.toLowerCase() === inputValue.toLowerCase()
        );
        addSkill(matchedSkill || inputValue);
      }
    } else if (event.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((value) => (value < suggestions.length - 1 ? value + 1 : value));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((value) => (value > 0 ? value - 1 : -1));
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if ((event.key === ',' || event.key === 'Tab') && inputValue.trim()) {
      event.preventDefault();
      const matchedSkill = AVAILABLE_SKILLS.find(
        (skill) => skill.toLowerCase() === inputValue.toLowerCase()
      );
      addSkill(matchedSkill || inputValue);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex min-h-[52px] flex-wrap gap-2 rounded-[20px] border px-3 py-3 transition-colors ${
          showSuggestions && suggestions.length > 0
            ? 'border-primary bg-main-bg'
            : 'border-border-main bg-surface'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-main-bg px-3 py-1 text-xs text-text-main"
          >
            {skill}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeSkill(skill);
              }}
              className="rounded-full p-0.5 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {skills.length < maxSkills ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={skills.length === 0 ? 'Search or add a skill...' : ''}
            className="min-w-[160px] flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted"
          />
        ) : null}
      </div>

      {showSuggestions && suggestions.length > 0 ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[20px] border border-border-main bg-surface-elevated shadow-soft-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-main-bg text-text-main'
                  : 'text-text-muted hover:bg-main-bg hover:text-text-main'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default SkillInput;
