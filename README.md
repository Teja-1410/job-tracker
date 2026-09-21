# Job Tracker

A full-stack job dispatch platform for local service businesses (AC repair, salon, catering, cleaning, electrician) to coordinate work in real time instead of relying on chaotic WhatsApp groups.

## Live Demo

- **Live App**: https://job-tracker-frontend-lilac-five.vercel.app
- **Backend API**: https://job-tracker-api-v66b.onrender.com
- **Frontend Repo**: https://github.com/Teja-1410/job-tracker-frontend
- **Backend Repo**: https://github.com/Teja-1410/job-tracker

*Note: the backend is hosted on Render's free tier, which sleeps after inactivity — the first request may take 20-30 seconds to respond.*

## Features

- **Authentication**: Secure signup/login with bcrypt password hashing and JWT tokens
- **Role-based access**: Four roles — Customer, Staff, Manager, Owner — each with distinct permissions
- **Job lifecycle**: Jobs move through pending → claimed → in-progress → done
- **Fair workload cap**: Staff can hold a maximum of 3 active jobs at once, preventing overload
- **Manager assignment**: Managers/owners can assign jobs directly to specific staff members
- **Job ownership enforcement**: Only the staff member a job is assigned to (or who claimed it) can update its status
- **Multi-page service catalog**: 5 services, each with 3 real sub-services, images, and pricing
- **Responsive design**: Works across desktop, tablet, and mobile, including a mobile navigation menu

## Tech Stack

- **Frontend**: React (Vite), React Router, plain CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (Atlas), Mongoose
- **Auth**: JWT, bcrypt

## Running Locally

### Backend

## Known Limitations

- The 3-active-job cap has a theoretical race condition under simultaneous requests from the same user — acceptable for this project's scale, would use a database transaction in production.
- Status transitions aren't currently restricted to a specific order (e.g., claimed → done directly).
- Job data loads once on page load rather than updating live — a planned next step is WebSocket-based real-time sync.
- The API base URL is currently hardcoded in the frontend rather than pulled from an environment variable.
- CORS is currently open to all origins, appropriate for this demo but would be restricted in production.
