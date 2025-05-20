An AI-driven car search engine that helps first-time buyers, students, and research-driven customers find the perfect vehicle with zero effort. CarGrep learns your preferences—budget, usage patterns, safety needs, tech features—and scours thousands of live listings to deliver a personalized shortlist and real-time deal alerts :contentReference[oaicite:0]{index=0}.

## Features

- **Agentic AI Assistant**  
  - Conversational UI for specifying car needs & preferences  
  - Auto-curated shortlist based on budget, fuel efficiency, safety ratings, and tech features  
  - Live notifications when matching listings become available  

- **Data Aggregation**  
  - Pulls listings from top Canadian marketplaces (AutoTrader.ca, CarGurus, etc.)  
  - Enriches listings with vehicle history and common issue data  

- **Secure User Onboarding & Payments**  
  - Full registration & session management via Clerk  
  - Subscription & one-time payments powered by Stripe  

- **Analytics & Observability**  
  - Vercel Analytics for traffic & performance insights  
  - HSTS strictly enforced  


## Tech Stack

- **Framework & Rendering**  
  - Next.js 15.1.4  
  - React  
  - Vercel AI SDK  

- **Cloud & AI**  
  - Microsoft Azure  
  - Azure OpenAI (o4-mini)  

- **Database & Auth**  
  - Supabase (PostgreSQL + real-time)  
  - Clerk (Auth / User Management)  

- **Payments**  
  - Stripe  

- **UI & Styling**  
  - Tailwind CSS  
  - Radix UI  
  - shadcn/ui  
  - Framer Motion  
  - Lucide (icons)  

- **Hosting & PaaS**  
  - Vercel (Frontend & Serverless Functions)  