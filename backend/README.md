# StudyTrace Rust Backend

This is the high-performance, asynchronous Rust backend for the **StudyTrace Engineering Exam & Study Tool**, built using the `axum` web framework, `tokio` runtime, `sqlx` database client, and the Gemini and Pinecone REST APIs.

---

## 1. Setup & Installation

### Prerequisites

- Install **Rust & Cargo** (version 1.70+ recommended).
- A running **Postgres Database** (e.g., Supabase project).
- Access keys for **Google AI Studio (Gemini)** and **Pinecone**.

### Environment Configuration

Create a `.env` file in the root of the `backend/` directory:

```env
# Database Connection (Supabase Postgres Session Pooler)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

# AI & Vector Credentials
GEMINI_API_KEY="AQ.Ab8..."
PINECONE_API_KEY="pcsk_..."
PINECONE_HOST="https://[INDEX-NAME]-[HASH].svc.[REGION].pinecone.io"

# Webhook Secrets
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"

# Server Port (optional, defaults to 8080)
PORT=8080
```

---

## 2. Running the Server

### Development Mode

To build and run the backend locally:

```bash
cargo run
```

### Production Release Build

To compile a highly optimized release binary:

```bash
cargo build --release
./target/release/studytrace_backend
```

*Note: On launch, the backend automatically connects to the database, verifies that the schemas are present, and creates them if they are missing.*

---

## 3. Production Deployment (Render)

The production backend is hosted on **Render** using Docker containerization:

- **Production API URL:** `https://project-mn.onrender.com`
- **Docker Deployment:** Set the Web Service Runtime to **Docker**, the root directory to **`backend`**, and configure your environment variables in the Render settings panel.

---

## 4. API Endpoint Documentation

All request payloads are in JSON format (unless marked as `multipart/form-data`) and responses return standard HTTP status codes.

### 4.1 Document Ingestion (`/api/ingest`)

Uploads a course PDF, parses the text page-by-page, generates 768-dimensional embeddings via `gemini-embedding-2`, indexes them in Pinecone under the user's namespace, and registers the file in the database.

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Payload:**
  - `user_id`: UUID string (identifying the student)
  - `file`: PDF file blob

#### Sample Ingestion Request

```bash
curl -X POST https://project-mn.onrender.com/api/ingest \
  -F "user_id=8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d" \
  -F "file=@/path/to/Signals_Unit3_LaplaceTransform.pdf"
```

#### Successful Ingestion Response (200 OK)

```json
{
  "message": "File indexed successfully",
  "file_name": "Signals_Unit3_LaplaceTransform.pdf",
  "file_size_bytes": 125866,
  "pinecone_namespace": "user_8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

---

### 4.2 Grounded Chat Query (`/api/query`)

Performs a vector search in Pinecone, compiles relevant document context, prompts the `gemini-flash-latest` model, and returns a grounded answer containing page-by-page citations.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Payload:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
  "query": "Explain the technology stack proposed in the quotation."
}
```

#### Sample Query Request

```bash
curl -H "Content-Type: application/json" \
  -X POST https://project-mn.onrender.com/api/query \
  -d '{"user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d", "query": "Explain the technology stack proposed in the quotation."}'
```

#### Successful Query Response (200 OK)

```json
{
  "text": "Based on the quotation document, the technology stack consists of React.js for Frontend, Flutter for Mobile, and Django REST Framework with PostgreSQL for Backend.",
  "grounded": true,
  "sources": [
    {
      "doc": "Signals_Unit3_LaplaceTransform.pdf",
      "page": 1
    }
  ]
}
```

---

### 4.3 Interactive Quiz Generator (`/api/quiz`)

Autogenerates a multiple-choice question derived from concepts extracted from the user's uploaded vector space.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Payload:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

#### Sample Quiz Request

```bash
curl -H "Content-Type: application/json" \
  -X POST https://project-mn.onrender.com/api/quiz \
  -d '{"user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"}'
```

#### Successful Quiz Response (200 OK)

```json
{
  "question": "Which backend framework is proposed for development?",
  "options": [
    "Django REST Framework",
    "Express.js",
    "Ruby on Rails",
    "Spring Boot"
  ],
  "correct": 0
}
```

---

### 4.4 Study Flashcards Generator (`/api/flashcards`)

Extracts 5 key terms, formulas, or concepts from the vector database and formats them as study flashcards.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Payload:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

#### Sample Flashcards Request

```bash
curl -H "Content-Type: application/json" \
  -X POST https://project-mn.onrender.com/api/flashcards \
  -d '{"user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"}'
```

#### Successful Flashcards Response (200 OK)

```json
[
  {
    "front": "Admin Panel (Web)",
    "back": "Allows campaign administrators to manage accounts, approve or reject posts, and view voter engagement details."
  },
  {
    "front": "Mobile App",
    "back": "Allows politicians to review posts, schedule approvals, and export lists to PDF."
  }
]
```

---

### 4.5 Razorpay Webhook Billing (`/api/webhook/razorpay`)

Endpoint to verify Razorpay checkout webhooks and upgrade users to the unlimited `pro` tier.

- **Method:** `POST`
- **Headers Required:** `X-Razorpay-Signature` (HMAC-SHA256 signature)
- **Payload:** Raw Razorpay webhook event JSON. Pass the student's `user_id` inside `notes.user_id` during checkouts.

---

## 5. Frontend Integration Guide (React / Node.js)

To connect your React components (`studytrace_app.jsx`) to the API, set up your base API configuration to dynamically resolve to either the local server or the production Render server:

```javascript
// Resolve base API URL based on environment (local vs. production)
const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://project-mn.onrender.com/api"
  : "http://localhost:8080/api";
```

### JavaScript Integration Code Snippets

#### 5.1 Ingesting Documents (PDF Uploads)

```javascript
const uploadDocument = async (file, userId) => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file); // file must be a File or Blob object

  try {
    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Upload failed");
    }

    const result = await response.json();
    console.log("Document indexed successfully:", result.file_name);
  } catch (error) {
    console.error("Ingestion error:", error.message);
  }
};
```

#### 5.2 Asking Grounded Questions (Chat Engine)

```javascript
const askQuestion = async (userQuery, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        query: userQuery,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Query failed");
    }

    const data = await response.json();
    
    // UI Response Mapping:
    // data.text (The markdown text answer generated by Gemini)
    // data.grounded (Boolean: true if derived from notes, false if fallback used)
    // data.sources (Array of { doc: string, page: number } citations)
    
    return {
      text: data.text,
      grounded: data.grounded,
      sources: data.sources,
    };
  } catch (error) {
    console.error("Query error:", error.message);
  }
};
```

#### 5.3 Generating Quizzes

```javascript
const generateQuiz = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) throw new Error("Failed to generate quiz");

    const data = await response.json();
    
    // UI Mapping:
    // data.question (The text of the question)
    // data.options (Array of 4 options strings)
    // data.correct (Integer: 0-3 index of the correct option)
    
    return {
      question: data.question,
      options: data.options,
      correct: data.correct,
    };
  } catch (error) {
    console.error("Quiz error:", error.message);
  }
};
```

#### 5.4 Loading Flashcards

```javascript
const loadFlashcards = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/flashcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) throw new Error("Failed to load flashcards");

    const data = await response.json();
    
    // UI Mapping:
    // data is an Array of { front: string, back: string }
    return data;
  } catch (error) {
    console.error("Flashcards error:", error.message);
  }
};
```
