import React, { useEffect, useMemo, useState } from 'react';

export function GlitchText({ className, words = ["DSUC", "BLOCKCHAIN", "DANANG"] }: { className?: string, words?: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0] ?? "");
  const minWidthCh = useMemo(
    () => Math.max(...words.map((word) => word.length), 6) + 1,
    [words],
  );

  useEffect(() => {
    setIndex(0);
    setDisplayText(words[0] ?? "");
  }, [words]);

  useEffect(() => {
    if (!words.length) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let glitchInterval: ReturnType<typeof setInterval> | undefined;

    const changeWord = () => {
      const nextIndex = (index + 1) % words.length;
      const targetWord = words[nextIndex];
      const chars = "!<>-_\\\\/[]{}—=+*^?#________";
      
      let iterations = 0;
      glitchInterval = setInterval(() => {
        setDisplayText((prev) => 
          targetWord.split("")
            .map((letter, i) => {
              if (i < iterations) {
                return targetWord[i];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );
        
        if (iterations >= targetWord.length) {
          clearInterval(glitchInterval);
          setIndex(nextIndex);
          timeoutId = setTimeout(changeWord, 3000);
        }
        
        iterations += 1/3;
      }, 30);
    };

    timeoutId = setTimeout(changeWord, 3000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (glitchInterval) {
        clearInterval(glitchInterval);
      }
    };
  }, [index, words]);

  return (
    <span
      className={`inline-block whitespace-nowrap ${className}`}
      style={{ minWidth: `${minWidthCh}ch` }}
    >
      {displayText}
    </span>
  );
}
