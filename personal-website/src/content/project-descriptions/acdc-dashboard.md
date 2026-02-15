# ACDC Dashboard - Consulting Business Health Platform

**Internal Tool for AI-First Consulting**

---

## Project Overview

The ACDC Dashboard is a full-stack business health platform built for AI-First Consulting. It tracks the entire consulting business cycle across four stages: **Attract** (sales pipeline), **Convert** (booked work), **Deliver** (team utilization), and **Collect** (cash conversion). Think of it as CRM + BI + time tracking + financial reporting + LinkedIn marketing — all in one unified platform.

**The Problem:** Consulting firms juggle a dozen disconnected tools for pipeline, time tracking, finances, and analytics. Context-switching kills productivity and makes it hard to see the full picture of business health.

**The Solution:** A single dashboard that unifies all consulting operations with real-time metrics, AI-powered document extraction, and automated reporting.

## Core Features

### ACDC Business Health Gauges

The central dashboard displays four animated D3 gauges showing real-time business health:

- **Attract**: Pipeline health as % of team capacity filled by weighted opportunities (5-12 week lookahead)
- **Convert**: Booked work as % of capacity allocated for the next 4 weeks
- **Deliver**: Actual team utilization from last week's time entries
- **Collect**: Cash conversion cycle from QuickBooks Online invoices

Each gauge includes 4-week rolling averages, YTD trends, and color-coded zones. Weekly snapshots are stored automatically via PostgreSQL cron jobs for historical trend analysis.

### CRM / Pipeline Management

Full opportunity pipeline with stages from cold through to won/unsuccessful. Includes thread-based discussions, file attachments, RFP document upload, and contact tracking per opportunity.

### AI-Powered Document Extraction

Upload RFP/RFQ documents (PDF or DOCX) and Claude Sonnet 4 automatically extracts proposal deadlines, contacts, scope summaries, requirements, and estimated values — with confidence scores per field. One-click application of extracted data to opportunity fields.

### Financial Reporting

Cash flow reports, aged receivables with aging buckets, and profit & loss breakdowns by customer — all synced from QuickBooks Online via OAuth 2.0 with automatic token refresh.

### Time Tracking Calendar

Interactive weekly calendar with drag-to-create time entries. Categories include delivery, improvement, admin, marketing, business development, and more. Syncs with Microsoft Outlook via Graph API.

### Team Capacity Planning

Per-employee capacity views with allocation grids, benchmark targets, and utilization metrics across 1-week, 4-week rolling, and YTD windows.

### LinkedIn Content Generation

AI-powered LinkedIn post generation using both Claude 3.5 Sonnet and Azure OpenAI GPT-5.1. Analyzes voice profile from historical posts and grounds content in real-time news from Perplexity AI, NewsAPI, and GNews.

### Additional Features

- **Network/Contact CRM** with relationship scoring and 37 industry labels
- **LinkedIn Organization Analytics** with follower growth and engagement metrics
- **PostHog Website Analytics** integration via HogQL queries
- **Sprint Mood Tracking** for team sentiment with emoji-based check-ins
- **Email Notifications** via Microsoft Graph API for deadline reminders
- **Role-based Access Control** with admin, manager, staff, and viewer permissions

## Technical Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript 5.9
- **Database**: Supabase (PostgreSQL with Row Level Security) — 35+ tables, 20+ database functions
- **AI**: Anthropic Claude Sonnet 4 (document extraction), Claude 3.5 Sonnet + Azure OpenAI GPT-5.1 (content generation)
- **Integrations**: QuickBooks Online, Microsoft Graph (calendar + email), LinkedIn API, PostHog, Perplexity AI
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts, react-d3-speedometer, TanStack React Table
- **Testing**: Vitest with React Testing Library
- **Deployment**: Vercel

### Database Highlights

- 35+ PostgreSQL tables with Row Level Security on all public tables
- 20+ database functions for metric calculations
- Weekly automated snapshots via pg_cron
- Complex SQL functions for pipeline metric calculations with interval overlap and JSONB audit trails

### External Integrations (6)

QuickBooks Online (OAuth with DB-persisted tokens), LinkedIn (org + member), Microsoft Graph (calendar + email), PostHog (HogQL), Perplexity AI (news aggregation)

---

_Demo coming soon. This is currently an internal tool used daily by AI-First Consulting._
