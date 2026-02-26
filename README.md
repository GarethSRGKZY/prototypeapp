# Volunteer Hub 🤝

A community platform for hyperlocal volunteering tasks, built for the Microsoft MGCI Challenge Statement 6.

## Features

### Core Features (from challenge brief)
- **Find Tasks** — Browse volunteer opportunities with AI-matched recommendations
- **Find Volunteers** — Search for available volunteers by skills and proximity
- **AI Matching** — Tasks matched to volunteers based on skills, location, and availability
- **AI Task Creation** — Auto-suggest skills from task descriptions
- **Create Tasks** — Anyone can upload microtasks (litter picking, event help, etc.)
- **Calendar & Scheduling** — Sync with phone calendar, view upcoming tasks
- **Post Availability** — Broadcast when you're free and what skills you offer
- **Community Feed** — Share volunteering experiences and celebrate impact
- **Impact Reporting** — Track hours, bags collected, items fixed, people helped, carbon saved
- **Organization Accounts** — Businesses and orgs can post tasks (marked with Org badge)
- **ID Verification** — Upload ID for a verified badge
- **Printable Reports** — Print impact reports for records

### Improvements Added
- **City Filter Dropdown** — Filter tasks by city location
- **Skill Filter** — Filter tasks and volunteers by required skills
- **AI Skill Suggestions** — When creating a task, AI auto-detects relevant skills from description
- **Task Completion Flow** — Accept → Complete → Auto-generate impact report
- **Community Impact Dashboard** — Aggregate stats across all volunteers
- **Top Volunteers Leaderboard** — Ranked by volunteer hours
- **Achievement Badges** — Gamification with earned badges
- **Voice Input** — Microphone button for task descriptions (UI ready)

## Tech Stack

- **Frontend:** React 18, React Router 6, Custom CSS
- **Backend:** Python Flask, SQLite
- **API:** RESTful JSON endpoints

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

### Quick Start
```bash
chmod +x start.sh
./start.sh
```

### Manual Setup
```bash
# Backend
cd backend
pip install flask flask-cors
python app.py

# Frontend (in a new terminal)
cd frontend
npm install
npm start
```

### Access
- App: http://localhost:5000 (production build served by Flask)
- Dev server: http://localhost:3000 (if using `npm start`)
- API: http://localhost:5000/api/

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List tasks (filter: city, status, skill) |
| GET | /api/tasks/cities | Get unique cities |
| GET | /api/tasks/ai-match/:userId | AI-matched tasks for user |
| POST | /api/tasks | Create task (AI auto-suggests skills) |
| POST | /api/tasks/:id/accept | Accept a task |
| POST | /api/tasks/:id/complete | Complete task + auto impact report |
| GET | /api/volunteers | List volunteers (filter: skill) |
| GET | /api/schedule/:userId | Get user schedule |
| POST | /api/availability | Post availability |
| GET | /api/community | Get community feed |
| POST | /api/community | Create community post |
| POST | /api/community/:id/like | Like a post |
| GET | /api/users/:id | Get user profile |
| GET | /api/users/:id/impact | Get personal impact report |
| GET | /api/impact/community | Get community-wide impact |
| GET | /api/skills | List all skills |
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |

## Project Structure
```
volunteer-hub/
├── backend/
│   ├── app.py              # Flask API server
│   ├── volunteer_hub.db    # SQLite database (auto-created)
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main app with routing
│   │   ├── index.js
│   │   ├── index.css       # Complete styling
│   │   └── pages/
│   │       ├── HomePage.js        # Find Tasks/Volunteers
│   │       ├── CalendarPage.js    # Schedule & Availability
│   │       ├── CommunityPage.js   # Feed & Impact
│   │       ├── ProfilePage.js     # User profile
│   │       ├── CreateTaskPage.js  # Task creation with AI
│   │       ├── ImpactReportPage.js # Detailed impact
│   │       └── WelcomePage.js     # Auth/onboarding
│   └── build/              # Production build
└── start.sh                # Quick start script
```
