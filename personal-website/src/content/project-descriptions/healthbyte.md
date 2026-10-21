# HealthByte

I built HealthByte with Huy Huynh, Hao Tang and Tobi Onibudo for the AI in Healthcare Challenge at the Atlantic AI Summit 2025. Twenty university teams from across Atlantic Canada had about 60 hours to model how people respond to real and fabricated health articles, and how messaging could counter misinformation. Our team took first place.

## What we built

We used COVID-19 vaccine news as the case. A persona agent reads an article as one fictional person, with a profile covering age, work, education, trust in government, drug companies and the media, specific worries and a starting vaccine stance. It answers with a 1–4 acceptance rating, a positive or negative reaction, and its reasoning.

An editor agent then rewrites the article for that person. It is told to keep the facts and change the framing to fit their concerns and trusted sources. The loop repeats until the rating reaches 3.4 out of 4 or ten rounds pass. At the end, the persona says how likely it would be to recommend the vaccine.

## How it works

I wrote the loop in Python against the OpenAI API. Both agents ran on o4-mini during the event, then gpt-4o-mini. Every round is logged to Supabase, or to CSV when no database is set.

The dashboard charts rating trajectories across real, fake and mixed news. Its chat shows the same persona answering before and after exposure to fake news. For the demo, the charts used sample data I generated from templates to show the analysis views. Scores from the loop describe model responses rather than real readers.

## The team

- Eduard Kakosyan: agent loop, logging and data generator
- [Huy Huynh](https://github.com/GHuyHuynh): dashboard and persona chat
- [Hao Tang](https://github.com/haotangphuoc): personas and article data
- [Tobi Onibudo](https://github.com/TobiOnibudo): persona pages and chat

[Try the dashboard](https://healthbyte-dashboard.vercel.app/) · [Source code](https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon)
