# CarGrep - Car Recommendation Platform

**Startup backed by Shiftkey Labs (Dalhousie University)**

**Built by Eduard Kakosyan** | **[cargrep.com](https://www.cargrep.com)**

---

## Project Overview

CarGrep helps people find cars without needing to know anything about cars. You describe what you need in plain English, and the platform searches across Canadian marketplaces to find matches, track prices, and alert you when deals appear.

**The Problem:** Buying a car means spending hours browsing thousands of listings across multiple sites, comparing specs you might not understand, and hoping you don't miss a good deal.

**What We Built:** A conversational interface that handles the research for you — aggregating listings from major Canadian marketplaces, learning your preferences, and monitoring the market in real-time.

## Background

- Startup backed by **Shiftkey Labs** at Dalhousie University
- Pitched at **StFX entrepreneurship competition**
- Live at [cargrep.com](https://www.cargrep.com)

## How It Works

### Conversational Search

- Built with Next.js and the Vercel AI SDK
- Uses Azure OpenAI's o4-mini for natural language understanding
- Extracts preferences from conversation: budget, usage patterns, safety priorities, features
- Returns ranked matches with explanations

### Data Pipeline

- Aggregates listings from major Canadian marketplaces (AutoTrader.ca, CarGurus, Kijiji)
- Deduplicates and validates listing data
- Enriches with vehicle history and reliability information
- Tracks price changes over time

### Real-Time Alerts

- Monitors new listings matching your criteria
- Price drop notifications for vehicles you're watching
- Runs continuously in the background

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Radix UI, shadcn/ui
- **Conversational Layer**: Vercel AI SDK with Azure OpenAI (o4-mini)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Auth**: Clerk
- **Payments**: Stripe
- **Hosting**: Vercel with edge functions

---

**Links:**

- [Live Platform](https://www.cargrep.com)
- [Shiftkey Labs](https://www.shiftkeyinnovation.com/)
