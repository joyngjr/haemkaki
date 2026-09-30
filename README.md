# :drop_of_blood: HaemKaki

**:trophy: 2nd Runner Up — HackItRx 2026**  
Organised by Open Government Products, the Alliance of Patients' Organisations Singapore and the
Pharmaceutical Society of Singapore.

HaemKaki is a companion web app for people living with haemophilia. It keeps track of
prophylaxis doses and factor supply, helps plan around travel and illness, and makes sure a dose
is never forgotten. Kaki, a friendly platelet mascot, shows how well covered you are at a glance.

Learn more about our product journey from our [Pitch Deck](Pitch%20Deck.pdf)!

<br>

## :star2: Features

### :syringe: Prophylaxis Tracker

- Tracks factor usage and works out how long your cover lasts from the schedule on your profile.
- Manages your inventory and works out how much factor to buy, and by when.
- Plans ahead for disruptions to your prophylaxis routine, such as travel or illness.

### :airplane: Travel Aid

- A downloadable Medical ID with translations, so carers abroad can read your diagnosis,
  medication and emergency contacts.
- Maps of haemophilia treatment centres across Southeast Asia.

### :bell: Reminder System

- A hardware device that attaches to the fridge, where prophylaxis is stored, and buzzes when it
  is time for your next dose.

### :sparkles: Ease of Use

- An MCP server for importing data from the ways you already track, such as a spreadsheet, through
  an AI assistant.
- Quick log, which records a dose in one tap using the preferences stored on your profile.

<br>

## :wrench: Technical Implementation

- The frontend (this repo) is built with React, TypeScript, Vite and Tailwind CSS, designed
  mobile-first, and deployed on Vercel.
- The [backend](https://github.com/joyngjr/haemkaki-backend) is a FastAPI service backed by
  PostgreSQL and deployed on Railway. It works out cover, run-out dates and order advice from an
  event ledger, rather than storing running totals.
- The Medical ID is translated by a self-hosted LibreTranslate instance, proxied through the
  backend, and exported as a PDF with jsPDF.
- Treatment centre maps are drawn with Leaflet.
- The MCP server lives on the backend at `/mcp`, so assistants such as Claude and ChatGPT can
  import records with a dry run first.

<br>

## :whale: Setup Guide

### Folder architecture

**Backend Repo:** https://github.com/joyngjr/haemkaki-backend

HaemKaki is split across two repos. To run them together, clone both into one parent folder
and put `docker-compose.yml` beside them:

```
haemkaki-project/
├── haemkaki/
├── haemkaki-backend/
└── docker-compose.yml       copied from haemkaki/docker-compose.yml
```

The folder names matter: `docker-compose.yml` builds from `./haemkaki` and `./haemkaki-backend`.

### Run everything with Docker Compose

You need [Docker](https://docs.docker.com/get-docker/) with Compose v2.

```bash
mkdir haemkaki-project && cd haemkaki-project
git clone https://github.com/joyngjr/heamkaki
git clone https://github.com/joyngjr/haemkaki-backend
cp haemkaki/docker-compose.yml .
docker compose up --build
```

| Service        | Address                    | Notes                                                    |
| -------------- | -------------------------- | -------------------------------------------------------- |
| Frontend       | http://localhost:5173      | Vite dev server; edits in `haemkaki/` hot-reload         |
| Backend        | http://localhost:8000/docs | FastAPI with `--reload`; edits in `app/` reload it       |
| MCP server     | http://localhost:8000/mcp  | For Claude Code; Claude.ai and ChatGPT need a public URL |
| Postgres       | localhost:5432             | User, password and database all `haemkaki`               |
| LibreTranslate | inside Docker only         | The backend reaches it at `http://libretranslate:5000`   |
