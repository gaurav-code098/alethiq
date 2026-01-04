const API_BASE_URL = "http://localhost:8080/api/chat";

export const getChatHistory = async (userId) => {
    // 1. Retrieve the token saved during login
    const token = localStorage.getItem("token");

    // 2. Add it to the Authorization header
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Critical for JwtAuthenticationFilter
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch chat history");
    }

    return response.json();
};