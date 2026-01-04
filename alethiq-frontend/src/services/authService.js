const API_URL = "http://localhost:8080/api/auth";

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error("Login failed");

    const token = await response.text();
    
    // 🟢 FIX: Use 'alethiq_token' so App.jsx can see it
    localStorage.setItem("alethiq_token", token);
    
    return token;
};

export const logout = () => {
    // 🟢 FIX: Remove the correct token
    localStorage.removeItem("alethiq_token");
};