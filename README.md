<div align="center">

# Alethiq 
  <p>
    <strong>A Next-Generation Intelligent Search Engine  Engine</strong>
  </p>
  <br />

  <br />
  <br />

  ![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=openjdk)
  ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.0-green?style=flat-square&logo=springboot)
  ![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
  ![Python](https://img.shields.io/badge/Python-3.10-yellow?style=flat-square&logo=python)
  ![Redis](https://img.shields.io/badge/Redis-Cache-red?style=flat-square&logo=redis)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Chat_History-47A248?style=flat-square&logo=mongodb&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Vectors_%26_Auth-4169E1?style=flat-square&logo=postgresql&logoColor=white)

</div>

---

## ✨ Overview

**Alethiq** is an AI-powered search and reasoning engine that bridges the gap between static LLM knowledge and real-time data. Unlike standard chatbots, Alethiq can **browse the web**, **watch YouTube videos**, and **generate dynamic UI widgets** on the fly.

It relies on a distributed microservices architecture, leveraging **Java Spring Boot** for orchestration, **Python** for neural inference, and a **Hybrid Database Strategy** (MongoDB + PostgreSQL) for optimal data management.

## 🚀 Key Features

<table>
  <tr>
    <td width="50%">
      <h3>🎨 Generative UI</h3>
      <p>Alethiq doesn't just reply with text. It renders <strong>interactive widgets</strong>, charts, and financial cards in real-time based on the context of the conversation.</p>
    </td>
    <td width="50%">
      <h3>📺 YouTube Intelligence</h3>
      <p><strong>New:</strong> A dedicated pipeline that ingests, transcribes, and analyzes YouTube video content, allowing users to "chat" with videos and extract key insights.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>💾 Hybrid Storage Engine</h3>
      <p>
        <strong>PostgreSQL (Neon):</strong> Stores User Auth & high-dimensional <strong>Search Embeddings</strong>.<br/>
        <strong>MongoDB (Atlas):</strong> optimized for storing unstructured <strong>Chat History</strong> and conversation threads.
      </p>
    </td>
    <td width="50%">
      <h3>🚀 Redis Acceleration</h3>
      <p><strong>New:</strong> Integrated <strong>Redis</strong> caching layer to store session context and frequent query vectors, drastically reducing load times.</p>
    </td>
  </tr>
</table>
<H4>NOTE:- YouTube Intelligence Pipeline is under Maintenance.  </H3>

## 🏗️ Architecture

Alethiq follows a **Microservices-style** architecture:

1.  **Frontend (Vercel):** React app that handles UI, Auth state, and SSE streaming.
2.  **Backend (Render):** Spring Boot API that acts as the orchestrator. It handles User Auth (OAuth2), manages Database (PostgreSQL/MySQL), and proxies requests to the AI engine.
3.  **AI Engine (Hugging Face):** A Python FastAPI service hosting the LLM inference logic.

```mermaid
graph TD
  subgraph Client ["Client Layer"]
    UI[React Frontend]
  end

  subgraph Orchestrator ["Backend Orchestrator"]
    API[API Gateway]
    Security[Spring Security]
    History[Chat History Service]
  end

  subgraph AI ["AI Engine"]
    LLM[LLM Inference]
    RAG[Vector Search]
    YTP[YouTube Pipeline]
  end

  subgraph Data ["Data Layer"]
    Redis[(Redis)]
    Mongo[(MongoDB)]
    Postgres[(PostgreSQL)]
  end

  subgraph External ["External"]
    Google[Google Auth]
    YT[YouTube API]
  end

  UI --> Security
  Security <--> Google
  Security --> Postgres

  UI <--> API
  API --> Redis
  
  API --> LLM
  LLM --> RAG
  RAG <--> Postgres
  LLM --> YTP
  YTP <--> YT

  API --> History
  History --> Mongo
```

---

## 🛠️ Tech Stack

### **Frontend**

* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS, Framer Motion (Animations)
* **Icons:** Lucide React
* **State:** React Context API

### **Backend**

* **Core:** Java 17, Spring Boot 3
* **Security:** Spring Security, OAuth2 Client, JWT
* **Reactive:** Spring WebFlux (for streaming)
* **Database:** PostgreSQL / MySQL (JPA/Hibernate)

### **AI Engine**

* **Runtime:** Python 3.10
* **API:** FastAPI, Uvicorn
* **Libraries:** PyTorch, Transformers, LangChain (optional)

---

## ⚙️ Environment Variables

To run this project, you will need to configure the following `.env` files.

### **1. Backend (`application.properties` or `.env`)**

```properties
# Server Configuration
server.port=8080

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/alethiq_db
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google

# JWT Secret
jwt.secret=YOUR_VERY_LONG_SECRET_KEY_HERE

# External Services
ai.service.url=http://localhost:8000  # Or your Hugging Face URL
app.frontend.url=http://localhost:5173 # Or [https://alethiq.tech](https://alethiq.tech)

```

### **2. Frontend (`.env`)**

```properties
VITE_API_URL=http://localhost:8080
# In production, use: [https://alethiq.onrender.com](https://alethiq.onrender.com)

```

---

## 🚀 Local Installation & Setup

### **Prerequisites**

* Node.js (v18+)
* Java JDK 17+
* Python 3.10+
* PostgreSQL or MySQL

### **1. AI Engine (Python)**

Navigate to the AI directory and install dependencies.

```bash
cd alethiq-ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```

### **2. Backend (Java Spring Boot)**

Configure your database in `application.properties`, then run the app.

```bash
cd alethiq-backend
./mvnw spring-boot:run

```

*The backend runs on `http://localhost:8080*`

### **3. Frontend (React + Vite)**

Install dependencies and start the dev server.

```bash
cd alethiq-frontend
npm install
npm run dev

```

*The frontend runs on `http://localhost:5173*`

---

## ☁️ Deployment

The system is deployed across three platforms to ensure scalability and free-tier compatibility.

| Component | Platform |
| --------- | -------- | 
| **Frontend** | **Vercel** 
| **Backend** | **Render** 
| **AI Engine** | **Hugging Face**


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/Feature`).
3. Commit your changes (`git commit -m 'Add some Feature'`).
4. Push to the branch (`git push origin feature/Feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

### **Authors**

* **Gaurav** - *Initial Work* - [@gaurav-code098](https://www.google.com/search?q=https://github.com/gaurav-code098)

```

```
