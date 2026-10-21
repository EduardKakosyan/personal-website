# CarGrep

I co-founded CarGrep with [Huy Huynh](https://github.com/GHuyHuynh) as a ShiftKey Labs build at Dalhousie. Shopping for a used car means checking several sites, missing deals that go fast, and comparing specs you may not understand. We wanted people to describe what they need and get a short list back.

## How it works

After signing up, people answered six quick questions about how they live and drive: weekends, road trips, storage, fuel economy and what they care about when buying. In the chat, a message went through our API to an n8n workflow. GPT-4o-mini turned the request into a query that returned at most five cars from our listings table. GPT-4o then summarised each car with price, mileage, transmission and Carfax status, and the app showed them as cards with links. If nothing matched, it said so instead of guessing.

A Python job pulled listings through a scraper and kept only cars with a price and a clean Carfax report.

Each account had a small balance of message tokens, and every chat message used one. That kept model costs predictable while people tried it.

## What we tried next

In April 2025 we tested an agent built with the AI SDK on Azure OpenAI that read dealership inventory pages directly. One dealer's site loaded its inventory with JavaScript, so the crawler only saw a fallback page. The two model calls in each search were also slow.

## Testing

The app had Jest tests for the chat, the survey, sign-up and login, and GitHub Actions ran them with a build on every push. When we rebuilt the front end on Next.js 15 in February 2025, the tests moved to Vitest.

## Where it stands

We pitched an early version at the ImpactX conference in November 2024. CarGrep is now a waitlist page.

[Visit CarGrep](https://www.cargrep.com)
