# DeskPad 🖥️

A beautiful, always-on smart desk display for repurposed Fire tablets. Dockerized for home server deployment.

![Phase 1: Clock + Calendar](https://img.shields.io/badge/Phase_1-Clock_%2B_Calendar-818cf8)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB)

## Features (Phase 1)

- ⏰ **Dual Clock** — Analog & digital views, long-press to toggle
- 📅 **Calendar** — Month view & year overview, long-press to switch
- 🌙 **AMOLED Dark Theme** — Optimized for always-on display
- 📱 **PWA** — Fullscreen, wake lock, offline-capable
- 🐳 **Dockerized** — One command to deploy on your home server
- ⚡ **Production-grade** — Health checks, structured logging, migrations

## Quick Start

### Prerequisites

- Docker & Docker Compose installed on your home server
- A Fire tablet with [Fully Kiosk Browser](https://www.fully-kiosk.com/)

### Deploy to Home Server

```bash
# Clone the repo to your server
git clone <your-repo-url> deskpad
cd deskpad

# Copy and customize environment
cp .env.example .env

# Deploy! 🚀
make deploy

# Verify it's running
curl http://localhost:8080/api/health
```

### Development

```bash
# Start dev environment with hot-reload
make dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# API docs: http://localhost:3001/api/docs
```

### Tablet Setup

1. Install [Fully Kiosk Browser](https://www.fully-kiosk.com/) on your Fire tablet
2. Set Start URL to `http://<your-server-ip>:8080`
3. Enable: Kiosk Mode, Keep Screen On, Immersive Mode
4. See [docs/TABLET_SETUP.md](docs/TABLET_SETUP.md) for detailed instructions

## Architecture

```
Fire Tablet (Browser) → Nginx (static + proxy) → FastAPI Backend
                              ↓                        ↓
                         React SPA              SQLite Database
```

## Project Structure

```
deskpad/
├── frontend/          # React 19 + TypeScript + Vite
├── backend/           # Python FastAPI + SQLite
├── nginx/             # Reverse proxy + static serving
├── docker-compose.yml # Production deployment
└── Makefile           # Common operations
```

## Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start dev environment with hot-reload |
| `make deploy` | Deploy production stack |
| `make logs` | Tail production logs |
| `make stop` | Stop all services |
| `make clean` | Remove containers, images, volumes |
| `make help` | Show all available commands |

## Interaction

- **Long-press the clock** → Toggle between analog and digital
- **Long-press the calendar** → Toggle between month and year view
- **Tap month arrows** → Navigate months
- **Tap year arrows** → Navigate years (in year view)
- **Tap a month card** → Jump to that month (from year view)

## License

MIT
