import { useState, useEffect } from "react";

export const useTypewriter = (text, speed = 10) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // RESET: If the source text is empty (new search), clear screen immediately
    if (!text) {
      setDisplayedText("");
      return;
    }

    // RESET: If source text is smaller than what we show, it means a hard reset happened
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      return;
    }

    // If we caught up, stop
    if (displayedText.length === text.length) return;

    // Calculate typing speed dynamically
    const diff = text.length - displayedText.length;
    const dynamicSpeed = diff > 50 ? 1 : speed;

    const timeoutId = setTimeout(() => {
      // Type next character(s)
      const chunk = diff > 50 ? text.slice(displayedText.length, displayedText.length + 5) : text.charAt(displayedText.length);
      setDisplayedText((prev) => prev + chunk);
    }, dynamicSpeed);

    return () => clearTimeout(timeoutId);
  }, [text, displayedText, speed]);

  return displayedText;
};