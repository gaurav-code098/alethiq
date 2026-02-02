import { useState, useRef, useCallback } from 'react';

export const useStream = () => {
    const [data, setData] = useState("");
    const [sources, setSources] = useState([]);
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState("Initializing...");
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);

    // 🟢 Point directly to Python (Hugging Face)
    const STREAM_URL = "https://gaurav-code098-alethiq.hf.space/query-stream"; 

    const streamData = useCallback(async (query, mode = "fast", history = [], image = null) => {
        // 1. Abort previous request
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        
        // 2. Reset State
        setData("");
        setSources([]);
        setImages([]);
        setStatus(image ? "Analyzing Image..." : "Thinking...");
        setIsStreaming(true);

        try {
            // 3. Prepare Payload (Include Image!)
            const payload = { 
                query: query, 
                mode: mode,
                image: image || null // <--- 🟢 CRITICAL FIX: Send the image data
            };

            const response = await fetch(STREAM_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(response.statusText || "Stream Error");
            }

            // 4. Read the Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "[DONE]") continue;
                    
                    const jsonStr = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
                    
                    try {
                        const parsed = JSON.parse(jsonStr);
                        
                        // Handle Status Updates
                        if (parsed.status) setStatus(parsed.status);
                        
                        // Handle Answer/Content Chunks
                        if (parsed.answer_chunk) setData(prev => prev + parsed.answer_chunk);
                        if (parsed.content) setData(prev => prev + parsed.content); // Fallback for vision
                        
                        // Handle Sources
                        if (parsed.sources) setSources(parsed.sources);
                    } catch (e) {
                        // Ignore parse errors for split chunks
                    }
                }
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Stream failed:", error);
                setData(prev => prev + "\n\n**Connection Error:** " + error.message);
            }
        } finally {
            setIsStreaming(false);
            setStatus("Ready");
        }
    }, []);

    const stopStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setStatus("Stopped");
    }, []);

    return { data, sources, images, status, isStreaming, streamData, stopStream };
};
