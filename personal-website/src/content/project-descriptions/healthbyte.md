# HealthByte - Atlantic AI Summit 2025

**First Place Winner** | **Healthcare Misinformation Simulation Platform**

**Team HealthByte:**

- **Eduard Kakosyan** (Lead Developer), kakosyaneduard@dal.ca
- **Huy Huynh**, huy.huynh@dal.ca, [GitHub](https://github.com/GHuyHuynh)
- **Hao Tang**, hao.tang@dal.ca, [GitHub](https://github.com/haotangphuoc)
- **Tobi Onibudo**, tobi.onibudo@dal.ca, [GitHub](https://github.com/TobiOnibudo)

---

## Project Overview

HealthByte simulates how different demographics react to healthcare content before it gets published. Instead of waiting to see if messaging lands well, communicators can test articles against synthetic personas and iteratively refine the content.

**The Problem:** Healthcare misinformation spreads faster than corrections. Traditional responses are reactive — by the time bad messaging is identified, the damage is done.

**What We Built:** A simulation platform that models diverse public reactions to healthcare content, letting writers optimize messaging proactively.

## Results

- **First Place** at the Atlantic AI Summit 2025 among 20 university teams from across Atlantic Canada
- Built for Nova Scotia healthcare communicators, writers, and reporters
- 48-hour hackathon build

## How It Works

### Two-Agent Reinforcement Learning Loop

**Persona Agent (OpenAI o4-mini)**

- Takes demographic and belief profiles from structured JSON data
- Reads healthcare articles and generates three outputs:
  - **Acceptance Rate**: Trust score (0-100)
  - **Sentiment**: Emotional reaction classification
  - **Reasoning**: Why they reacted that way

**Editor Agent (Content Optimizer)**

- Takes the persona feedback and rewrites the article
- Maintains factual accuracy while improving clarity and trust
- Targets specific audience segments that scored poorly

**The Loop**

- Runs up to 15 iterations of persona reaction → editor rewrite
- Converges when acceptance rates stabilize across target demographics
- Tracks improvement metrics throughout

### Technology Stack

- **Backend**: Python with structured prompt pipelines
- **Models**: OpenAI o4-mini for persona simulation, Gemini 2.5 Flash for editing
- **Data**: Structured JSON for persona profiles and content versioning
- **Dashboard**: Custom web visualization for tracking content evolution

## Dashboard

Try it: **[HealthByte Dashboard](https://healthbyte-dashboard.vercel.app/)**

- Watch personas react to healthcare content in real-time
- Track how articles change through each iteration
- Compare original vs. optimized content side-by-side
- See acceptance rates and sentiment shifts across demographics

## Use Cases

1. **Public Health Campaigns**: Test vaccine information across diverse communities
2. **Medical Communications**: Improve patient education materials
3. **Healthcare Journalism**: Help reporters craft clearer articles
4. **Policy Communications**: Test government health messaging before release

---

**Links:**

- [Live Demo](https://healthbyte-dashboard.vercel.app/)
- [GitHub Repository](https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon)
- [Atlantic AI Summit 2025](https://atlanticaisummit.com/)
