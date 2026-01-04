import { useState, useRef } from 'react';

export const useStream = () => {
  const [data, setData] = useState("");
  const [sources, setSources] = useState([]);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("Idle");
  const [isStreaming, setIsStreaming] = useState(false);
  
  const abortControllerRef = useRef(null);

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setStatus("Stopped");
    }
  };

  const streamData = async (query, mode = "fast", history = []) => {
    setData("");
    setSources([]);
    setImages([]);
    setStatus("Thinking...");
    setIsStreaming(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem("alethiq_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const headers = { "Content-Type": "application/json" };
      if (token && token !== "null") headers["Authorization"] = `Bearer ${token}`;

      // 🟢 SMART CONTEXT LOGIC
      let finalQuery = query;
      
      // Only attach history if the user implies a follow-up
      // We look for pronouns or connector words
     const followUpKeywords = [
    "it", "he", "she", "they", "this", "that", 
    "more", "compare", "difference", "explain", "detail"
];
      const isFollowUp = followUpKeywords.some(word => query.toLowerCase().split(' ').includes(word));

      if (isFollowUp && history.length > 0) {
          const lastUserMessage = history.filter(msg => msg.type === 'user').slice(-1)[0];
          if (lastUserMessage) {
              finalQuery = `Context: ${lastUserMessage.content}. Question: ${query}`;
              console.log("🔗 Context Attached:", finalQuery);
          }
      } else {
          console.log("🆕 New Topic Detected (No Context Sent)");
      }

      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query: finalQuery, mode }), // 'mode' is ignored by backend now but safe to keep
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(response.statusText);
      if (!response.body) throw new Error("No stream body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith("data:")) line = line.replace("data:", "").trim();
            if (line === "[DONE]") {
                setIsStreaming(false);
                setStatus("Complete");
                return;
            }

            try {
              const parsed = JSON.parse(line);
              if (parsed.answer_chunk) {
                  setData((prev) => prev + parsed.answer_chunk);
              } else if (parsed.sources) {
                  setSources(parsed.sources);
              } else if (parsed.images) {
                  setImages(parsed.images);
              } else if (parsed.status) {
                  setStatus(parsed.status);
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Stream failed:", error);
        setData((prev) => prev + `\n\n**Error:** ${error.message}`);
        setStatus("Error");
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  return { data, sources, images, status, isStreaming, streamData, stopStream };
};