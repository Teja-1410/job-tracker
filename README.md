# Job Tracker

A full-stack job dispatch platform for local service businesses (AC repair, salon, catering, cleaning, electrician) to coordinate work in real time instead of relying on chaotic WhatsApp groups.

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