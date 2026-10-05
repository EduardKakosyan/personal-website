# HealthByte

I built HealthByte with Huy Huynh, Hao Tang, and Tobi Onibudo during the Atlantic AI Summit hackathon in 2025. Our team took first place after the 48-hour build.

We explored whether simulated readers could help a writer spot confusing or unconvincing parts of a healthcare article before publishing it.

## What we built

One agent reads an article as a set of fictional personas, each with a demographic and belief profile. It returns a trust score, a sentiment, and an explanation for each reaction. A second agent uses that feedback to revise the article.

The loop runs for up to fifteen rounds, with a dashboard showing how the text and simulated reactions change. Those scores describe the model’s responses; they aren’t measurements of how real readers would react.

## How it works

We used Python for the loop, OpenAI o4-mini for the personas, and Gemini 2.5 Flash for editing. Persona profiles and article versions are stored as structured JSON.

The dashboard lets you compare article versions and follow the scores across rounds.

## The team

- Eduard Kakosyan — lead developer
- [Huy Huynh](https://github.com/GHuyHuynh)
- [Hao Tang](https://github.com/haotangphuoc)
- [Tobi Onibudo](https://github.com/TobiOnibudo)

[Try the dashboard](https://healthbyte-dashboard.vercel.app/) · [Source code](https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon)
