import { useState, useRef, useCallback } from 'react';

export const useStream = () => {
    const [data, setData] = useState("");
    const [sources, setSources] = useState([]);
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState("Initializing...");
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);

    // 🟢 CHANGE THIS: Point directly to Python (Hugging Face)
    // This restores the "Direct Connection" that works
    const STREAM_URL = "https://gaurav-code098-alethiq.hf.space/query-stream"; 

    const streamData = useCallback(async (query, mode, history = [], image = null) => {
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
                    // Python doesn't need the Java token, so we can omit Auth here
                },
                body: JSON.stringify({ 
                    query, 
                    mode: "fast" // Ensure mode is sent
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(response.statusText || "Stream Error");
            }

            // ... (Rest of your existing parsing logic) ...
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
                        if (parsed.status) setStatus(parsed.status);
                        if (parsed.answer_chunk) setData(prev => prev + parsed.answer_chunk);
                        if (parsed.sources) setSources(parsed.sources);
                    } catch (e) {}
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
