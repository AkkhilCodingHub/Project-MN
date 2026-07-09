# Project Proposal: Reels Script Generator

A fast, AI-powered tool designed to help content creators generate video scripts, hooks, pacing cues, captions, and hashtags in seconds.

## 1. Executive Summary
Content creators spend hours brainstorming hooks, drafting scripts, and researching trending hashtags. The Reels Script Generator automates this workflow, converting user inputs (niche, tone, duration, language) into a complete, ready-to-shoot video production package using Gemini 1.5 Flash. It addresses a highly monetizable pain point with minimal technical complexity.

## 2. Key Pitch Points (Meeting Slides)
- **High Pain Point Relief:** Writing high-converting hooks and scripts is the biggest bottleneck for creators. This cuts scripting time from 2 hours to 2 minutes.
- **Distribution Advantage:** Leverage existing creator networks and social media assets (such as Midnight Thread) for immediate, zero-cost initial user acquisition and social proof.
- **High Velocity MVP:** Low build complexity with no database-heavy vector searching required. Can be shipped to production in 1.5 to 2 weeks.
- **Clear Monetization Path:** Freemium model that gates the number of daily generations, with a direct subscription upgrade path via Razorpay.

## 3. Market & Audience
- **Primary:** Social media content creators (Instagram Reels, YouTube Shorts, TikTok).
- **Secondary:** Freelance video editors, social media management agencies, brand marketing managers.

## 4. Product Tiers & Pricing
* **Free Tier:** 3–5 script generations per day. Access to standard tones and niches.
* **Pro Tier (Subscription):** Unlimited generations, custom brand voice presets, bulk script exporting, and early access to new AI templates.
* **Monetization Engine:** Subscriptions processed via Razorpay integration (reloading tokens/sessions based on payment webhooks).

## 5. MVP Cost Breakdown (Startup Phase)
All infrastructure is set up to utilize free tiers to validate product-market fit before incurring costs:

| Resource | Service / Provider | MVP Cost | Notes / Limits |
| :--- | :--- | :--- | :--- |
| **Frontend/Hosting** | Vercel (Hobby Tier) | **Free** | Unlimited deployment, SSL included. |
| **AI LLM API** | Google Gemini 1.5 Flash | **Free** | Free tier available (rate-limited, watch RPM limits). |
| **Auth & Database** | Supabase (Free Tier) | **Free** | 500MB DB size, up to 50k monthly active users. |
| **Payment Gateway** | Razorpay | **Free to Integrate** | Transaction fees are usage-based (2% + GST per txn). |
| **Domain Name** | Namecheap / GoDaddy | **₹700 - ₹1,200/year** | Custom brand domain (e.g., `.com` or `.in`). |
| **Total Cost** | | **₹700 - ₹1,200** | Practically free to deploy and launch. |

## 6. Strategic Sequencing Recommendation
Start development with the **Reels Script Generator**. It is simpler, has less operational risk (no PDF parsing or vector indexing failures), and serves as an excellent testbed to wire up the billing pipeline (Razorpay + Supabase), which can then be reused for the **Exam/Study Tool**.
