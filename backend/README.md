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
# Database Connection (Supabase Postgres)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# AI & Vector Credentials
GEMINI_API_KEY="AIzaSy..."
PINECONE_API_KEY="pcsk_..."
PINECONE_HOST="https://YOUR_INDEX_NAME-YOUR_HASH.svc.YOUR_REGION.pinecone.io"

# Webhook Secrets
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"

# Server Port (optional, defaults to 8080)
PORT=8080
```

---

## 2. Running the Server

### Development mode

```bash
cargo run
```

### Production release build

```bash
cargo build --release
./target/release/studytrace_backend
```

*Note: On launch, the backend will automatically check if the tables `user_study_stats` and `uploaded_documents` exist in your Postgres database and create them if they are missing.*

---

## 3. API Documentation

All request payloads are in JSON format (unless marked as `multipart/form-data`) and responses are returned with standard HTTP status codes.

### 1. Document Upload (`/api/ingest`)

Uploads a course PDF, parses the text page-by-page, generates embeddings, upserts vectors to Pinecone, and logs the upload in the database.

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `user_id`: UUID string (identifying the student)
  - `file`: PDF file blob

#### Sample Ingest Curl Request

```bash
curl -X POST http://localhost:8080/api/ingest \
  -F "user_id=8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d" \
  -F "file=@/path/to/Signals_Unit3_LaplaceTransform.pdf"
```

#### Successful Ingest Response (200 OK)

```json
{
  "message": "File indexed successfully",
  "file_name": "Signals_Unit3_LaplaceTransform.pdf",
  "file_size_bytes": 2194812,
  "pinecone_namespace": "user_8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

---

### 2. Grounded RAG Query (`/api/query`)

Processes questions by running vector searches in Pinecone, compiling document excerpts as context, prompting Gemini Flash, and returning a grounded answer with exact citation sources.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Payload Schema:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
  "query": "Find the Laplace transform of x(t) = e^(-2t)u(t) and explain the ROC."
}
```

#### Successful Query Response (200 OK)

```json
{
  "text": "Using the Laplace pair for causal exponentials, x(t) = e^(-2t)u(t) transforms to X(s) = 1/(s+2).\n\nStep-by-step:\n1. Integrate x(t)e^(-st) dt from 0 to infinity.\n2. Obtain X(s) = 1/(s+2), valid when Re(s) > -2.\n\nROC lies to the right of the pole at s = -2.",
  "grounded": true,
  "sources": [
    {
      "doc": "Signals_Unit3_LaplaceTransform.pdf",
      "page": 7
    }
  ]
}
```

*Note: If the answers are not found in the student's notes, `grounded` will return `false`, sources will be empty, and the response text will start with: "I cannot find this in your uploaded notes. However, based on general engineering principles..."*

---

### 3. Generate Mock Quiz (`/api/quiz`)

Autogenerates a multiple-choice question based on terms and concepts extracted from the user's uploaded documents.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Payload Schema:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

#### Successful Quiz Response (200 OK)

```json
{
  "question": "For x(t) = e^(-2t)u(t), where does the ROC lie?",
  "options": [
    "Re(s) > -2",
    "Re(s) < -2",
    "Re(s) = -2 only",
    "Entire s-plane"
  ],
  "correct": 0
}
```

---

### 4. Generate Study Flashcards (`/api/flashcards`)

Extracts a set of 5 key terms/formulas and their definitions from the user's vector namespace.

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Payload Schema:**

```json
{
  "user_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d"
}
```

#### Successful Flashcards Response (200 OK)

```json
[
  {
    "front": "ROC (Region of Convergence)",
    "back": "The set of values of s for which the Laplace transform integral converges."
  },
  {
    "front": "Causal Signal",
    "back": "A signal that is zero for all time t < 0. Its Laplace ROC lies to the right of the rightmost pole."
  }
]
```

---

### 5. Razorpay Webhook Billing (`/api/webhook/razorpay`)

Verification endpoint to receive order or subscription status webhooks, automatically upgrading users to the unlimited `pro` tier.

- **Method:** `POST`
- **Headers Required:** `X-Razorpay-Signature` (HMAC-SHA256 signature)
- **Payload:** Raw Razorpay webhook event JSON. Pass the student's `user_id` inside `notes.user_id` during checkouts.

---

## 4. Linking to the Frontend (React / Node Integration)

To connect the React frontend layout (`studytrace_app.jsx`) to this Rust backend, replace the mock handler states with asynchronous HTTP requests.

### Base API Configuration

Set the local development API base address in your frontend constants:

```javascript
const API_BASE_URL = "http://localhost:8080/api";
```

### 1. Ingesting Documents (PDF Uploads)

Bind your file input upload handler to call the `/api/ingest` endpoint:

```javascript
const uploadDocument = async (file, userId) => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: "POST",
      body: formData, // Browser automatically sets Content-Type to multipart/form-data
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to upload document");
    }

    const data = await response.json();
    console.log("Document indexed:", data.file_name);
    // Refresh your file list and status here
  } catch (error) {
    console.error("Upload error:", error.message);
  }
};
```

### 2. Asking Grounded Questions (Chat Engine)

Hook the message sender in your chat box to request answers from `/api/query`:

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
      const errData = await response.json();
      throw new Error(errData.error || "Failed to query database");
    }

    const data = await response.json();
    
    // Add Gemini response to your messages array
    const aiMessage = {
      id: "ai-" + Date.now(),
      role: "ai",
      grounded: data.grounded,
      text: data.text,
      sources: data.sources, // Array of { doc, page }
    };
    
    setMessages((prev) => [...prev, aiMessage]);
  } catch (error) {
    console.error("Query error:", error.message);
  }
};
```

### 3. Generating Quizzes & Flashcards (Study Tools)

Query the `/api/quiz` or `/api/flashcards` endpoints to refresh your dashboard study panel:

```javascript
const loadQuiz = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) throw new Error("Failed to load quiz");
    
    const quizData = await response.json();
    // Sets state: { question: string, options: string[], correct: number }
    setQuiz(quizData); 
  } catch (error) {
    console.error(error.message);
  }
};

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

    const flashcardsData = await response.json();
    // Sets state: Array of { front: string, back: string }
    setFlashcards(flashcardsData);
  } catch (error) {
    console.error(error.message);
  }
};
```
