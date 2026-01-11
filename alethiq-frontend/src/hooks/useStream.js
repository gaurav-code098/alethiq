import { useState, useRef, useCallback } from 'react';

export const useStream = () => {
    const [data, setData] = useState("");
    const [sources, setSources] = useState([]);
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState("Initializing...");
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);

    // 🔴 JAVA BACKEND URL (The Proxy)
    // React talks to Java -> Java talks to Python
    const STREAM_URL = "https://alethiq.onrender.com/api/chat/stream"; 
    // ^^^ MAKE SURE THIS MATCHES YOUR JAVA CONTROLLER ENDPOINT

    const streamData = useCallback(async (query, mode, history = [], image = null) => {
        // 1. Reset everything immediately
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        
        setData("");
        setSources([]);
        setImages([]);
        setStatus("Thinking...");
        setIsStreaming(true);

        try {
            const response = await fetch(STREAM_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Add Auth Token if needed by Java Backend
                    "Authorization": `Bearer ${localStorage.getItem("alethiq_token")}`
                },
                body: JSON.stringify({ 
                    query, 
                    mode, 
                    history,
                    image // Pass image if supported
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Process complete lines (SSE format)
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep the last incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "[DONE]") continue;

                    // Remove "data: " prefix if present (Python sends this)
                    const jsonStr = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;

                    try {
                        const parsed = JSON.parse(jsonStr);

                        // 1. Status Update
                        if (parsed.status) {
                            setStatus(parsed.status);
                        }
                        
                        // 2. Answer Chunk (The text)
                        if (parsed.answer_chunk) {
                            setData(prev => prev + parsed.answer_chunk);
                        }

                        // 3. Sources
                        if (parsed.sources) {
                            setSources(parsed.sources);
                        }

                        // 4. Images (if any)
                        if (parsed.images) {
                            setImages(parsed.images);
                        }

                    } catch (e) {
                        // Ignore parse errors for partial chunks
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
