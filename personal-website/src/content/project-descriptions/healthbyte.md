# HealthByte

## Overview
Developed a novel two-agent, reinforcement-style workflow in 60 hours:

- A **Persona Agent**, powered by the o4-mini model, loaded diverse profiles to simulate individual reactions (acceptance rate, sentiment, reasoning) to healthcare articles
- Implemented an **Editor Agent** that received the Persona Agent's feedback, iteratively editing original articles (up to 15 cycles in a reinforcement loop) to improve persuasiveness for specific personas and counter misinformation 