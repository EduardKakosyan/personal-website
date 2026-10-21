# Second Brain

Huy Huynh, Hao Tang and I built Second Brain at the Volta Agentic AI Hackathon in Halifax in November 2024, where our team took second place. We wanted one assistant that knew a student's course material and could help plan around it.

## From course files to answers

Students keep assignments, slides, notes and syllabuses in a Google Drive folder. An n8n workflow watches the folder for new files, splits their text into chunks and stores embeddings in Pinecone, so the assistant can search them when answering a question.

![Google Drive workflow](/images/image.png)

A file attached in the chat goes through the same steps. The assistant uses its text right away, and it stays searchable later. If there's no attachment, the assistant answers from the stored documents.

![Main assistant workflow](/images/main.png)

## Planning study time

Given a syllabus, the assistant looks for exam, test and quiz dates and creates a calendar event for each one, after checking that the time slot is free. A third tool reads the day's Gmail and summarises it.

We built each tool as its own n8n workflow and wrote a description of its inputs and outputs. That made the agent better at choosing the right tool.

![Email workflow](/images/email.png)

![Read calendar events workflow](/images/get.png)

![Create calendar events workflow](/images/set.png)

[Source code](https://github.com/EduardKakosyan/volta_hackathon)
