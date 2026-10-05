# CarGrep

I built CarGrep to let people search for a car by describing what they need: their budget, how they drive, and the features that matter to them. It brings together listings from Canadian marketplaces and lets people follow prices over time.

The project was backed by Shiftkey Labs at Dalhousie, and I pitched it at the StFX entrepreneurship competition.

## How it works

The chat turns a conversation into search preferences and returns matching cars with explanations. Behind it, a data pipeline collects listings from AutoTrader.ca, CarGurus, and Kijiji, removes duplicates, and tracks price changes.

People can watch cars they’re interested in and get alerts for new matches or price drops.

## What I used

The app uses Next.js and TypeScript, with the Vercel AI SDK and Azure OpenAI for the conversation. Supabase stores the data, Clerk handles sign-in, and Stripe handles payments.

[Visit CarGrep](https://www.cargrep.com)
