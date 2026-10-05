# Second Brain

Huy Huynh, Hao Tang, and I built Second Brain at the Volta Hackathon in 2024, where our team took second place. It connects course documents with a chat assistant and calendar to help students plan their studying.

## From course files to answers

We used Google Drive for assignments, slides, notes, and syllabuses. An n8n workflow checks for new files every ten minutes, extracts their text, and adds it to Pinecone so the assistant can search it when answering a question.

![Google Drive workflow](/images/image.png)

Files attached directly in chat go through the same process. The assistant can use the file in the current conversation and retrieve it later.

![Main assistant workflow](/images/main.png)

## Planning study time

The assistant can pull exam dates from a syllabus and add them to a calendar. It checks for existing events before scheduling anything. We also gave it a tool for email.

These tools were separate n8n workflows with their own inputs and outputs:

![Email workflow](/images/email.png)

![Read calendar events workflow](/images/get.png)

![Create calendar events workflow](/images/set.png)

[Source code](https://github.com/EduardKakosyan/volta_hackathon)
