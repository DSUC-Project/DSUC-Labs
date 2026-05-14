import React, { useState, useEffect } from 'react';

export function GlitchText({ className, words = ["DSUC", "BLOCKCHAIN", "DANANG"] }: { className?: string, words?: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const changeWord = () => {
      const nextIndex = (index + 1) % words.length;
      const targetWord = words[nextIndex];
      const chars = "!<>-_\\\\/[]{}—=+*^?#________";
      
      let iterations = 0;
      const glitchInterval = setInterval(() => {
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
      clearTimeout(timeoutId);
    };
  }, [index]);

  return (
    <span className={`inline-block whitespace-nowrap min-w-[150px] ${className}`}>
      {displayText}
    </span>
  );
}
