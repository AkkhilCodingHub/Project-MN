# Project Proposal: Engineering Exam & Study Tool

An AI-powered preparation dashboard for engineering students, leveraging Retrieval-Augmented Generation (RAG) on course notes and past exam papers to generate curriculum-aligned answers, mock quizzes, and study flashcards.

## 1. Executive Summary
During exam preparation, engineering students struggle with generic web-search answers that fail to match their specific university curriculum. The Engineering Exam & Study Tool solves this by allowing students to upload their class notes, lecture PDFs, and Previous Year Questions (PYQs). Using LangChain/LangGraph and Pinecone vector search, the AI answers student prompts using the exact terminology, tables, and step-by-step methods required for high marks.

## 2. Key Pitch Points (Meeting Slides)
- **High Retention & Stickiness:** Students return to the platform daily during exam seasons, creating highly recurring engagement loops.
- **Academic Context Matching (RAG):** Unlike generic ChatGPT or Gemini conversations, answers are grounded directly in student notebooks and university syllabus materials.
- **Built-in Student Distribution:** Direct access to college messaging groups (WhatsApp/Telegram) and campus networks makes user acquisition fast and zero-budget.
- **High Monetization Readiness:** High-stress scenarios like university exams significantly lower the friction for paid upgrades (unlimited uploads, prompt completions).

## 3. Market & Audience
- **Primary:** Engineering undergraduates (CS, IT, ECE, Mech, Civil) preparing for semester-end and midterm exams.
- **Secondary:** Professors looking to autogenerate class quizzes, and study groups sharing notes.

## 4. Product Tiers & Pricing
* **Free Tier:** Upload up to 3 PDFs/notes. 10 interactive questions per day.
* **Pro Tier (Subscription):** Unlimited document uploads, unlimited questions, priority RAG retrieval speed, and one-click PDF generation of step-by-step answers.
* **Monetization Engine:** Subscriptions processed via Razorpay integration, controlling Pinecone namespace uploads.

## 5. MVP Cost Breakdown (Startup Phase)
All infrastructure is set up to utilize free tiers to validate product-market fit before incurring costs:

| Resource | Service / Provider | MVP Cost | Notes / Limits |
| :--- | :--- | :--- | :--- |
| **Frontend/Hosting** | Vercel (Hobby Tier) | **Free** | Unlimited deployment, SSL included. |
| **AI LLM API** | Google Gemini 1.5 Flash | **Free** | Free tier available (rate-limited, watch RPM limits). |
| **Vector Indexing** | Pinecone (Starter Tier) | **Free** | 1 Index, up to ~100k vectors (plenty for 100+ multi-page note files). |
| **Auth & Database** | Supabase (Free Tier) | **Free** | 500MB DB size, up to 50k monthly active users. |
| **Payment Gateway** | Razorpay | **Free to Integrate** | Transaction fees are usage-based (2% + GST per txn). |
| **Domain Name** | Namecheap / GoDaddy | **₹700 - ₹1,200/year** | Custom brand domain (e.g., `.com` or `.in`). |
| **Total Cost** | | **₹700 - ₹1,200** | Practically free to deploy and launch. |

## 6. Strategic Sequencing Recommendation
This project is classified as the **High-Value Follow-Up** to the Reels Script Generator. Because it requires a RAG pipeline (chunking, embedding, and vector database query), it takes slightly longer (2.5 to 3 weeks) to launch. We recommend shipping the Reels Script Generator first to establish and debug our user authentication and payments infrastructure, then applying that foundation here.
