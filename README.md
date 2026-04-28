# Mahavir Mediscope Eye Centre

> A full-stack healthcare web application with a complete CI/CD pipeline  
> built using Jenkins, Docker, SonarCloud, Prometheus and Grafana.

![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-red?logo=jenkins)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)
![SonarCloud](https://img.shields.io/badge/SonarCloud-Quality-orange?logo=sonarcloud)
![Firebase](https://img.shields.io/badge/Firebase-Database-yellow?logo=firebase)

---

## Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Pipeline Stages](#-pipeline-stages)
- [Getting Started](#-getting-started)
- [Running the Application](#-running-the-application)
- [Monitoring](#-monitoring)
- [Security Findings](#-security-findings)
- [Email Notifications](#-email-notifications)
- [Author](#-author)

---

##  Project Overview

Mahavir Mediscope Eye Centre is a full-stack healthcare web application  
designed to digitize and streamline the operations of an eye care hospital.  
The application allows patients to book appointments, consult doctors via  
video calls, and manage their health profiles. Doctors can manage schedules  
and patient records through a dedicated dashboard.

The project includes a fully automated CI/CD pipeline with 10 stages covering  
build, test, code quality, security, deployment, release, and monitoring.

---

## Features

| Feature | Description |
|--------|------------|
|  Authentication | Firebase-based secure login and registration |
|  Appointment Booking | Patients can book appointments with doctors |
|  Doctor Dashboard | Doctors manage schedules and patient records |
|  Video Consultation | Jitsi-based integrated video conferencing |
|  Patient Profile | Personal health profile management |
|  Health Monitoring | Real-time backend health and metrics API |

---

## Tech Stack

### Application

| Layer | Technology | Purpose |
|------|-----------|--------|
| Frontend | React.js | Patient-facing user interface |
| Web Server | nginx | Serves React build in production |
| Backend | Node.js + Express | REST API and business logic |
| Database | Firebase Firestore | Cloud NoSQL data storage |
| Auth | Firebase Auth | Secure user authentication |
| Video | Jitsi | Video consultation feature |

### DevOps & CI/CD

| Tool | Purpose |
|------|--------|
| Jenkins | CI/CD pipeline orchestration |
| GitHub | Version control and source code hosting |
| Docker | Application containerization |
| Docker Compose | Multi-container orchestration |
| SonarCloud | Static code quality analysis |
| ESLint | JavaScript linting |
| Jest + Supertest | Automated unit and API testing |
| npm audit | Dependency security scanning |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization and dashboards |
| Mailtrap | Email notification testing |

---

##  CI/CD Pipeline

The entire pipeline is defined as code in the `Jenkinsfile` and runs on every push to the `main` branch.


GitHub Push
│
▼
Checkout → Build → Test → Code Quality → Security → Deploy → Verify → Release → Monitoring


---

## Pipeline Stages

### 1. Checkout
Pulls the latest code from the `main` branch using Jenkins Git credentials.

### 2. Build
- Runs `npm install` and `npm run build`
- Builds Docker images
- **Artifacts:**
  - `backend.tar` (60.59 MiB)
  - `frontend.tar` (30.71 MiB)

### 3. Test
- Runs Jest + Supertest
- Endpoints tested:
  - `GET /health` → HTTP 200
  - `GET /api/test` → `{ success: true }`
-  **Result:** 2/2 tests passing

### 4. Code Quality
- ESLint checks
- SonarCloud analysis
- **Result:** Security Rating A, 240 issues identified

### 5. Security Scan
- Backend: 0 vulnerabilities 
- Frontend: 48 vulnerabilities

### 6. Deploy
- Frontend → `nginx:alpine` (port 80)
- Backend → `node:18-alpine` (port 5000)

### 7. Verify Deployment

curl -f http://localhost:5000/health


### 8. Release
- Creates Git tag
- Tags Docker images
- Pushes to GitHub

### 9. Monitoring & Alerting
- Prometheus (9090)
- Grafana (3000)
- Alerts:
  - BackendDown
  - HighResponseTime

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- Jenkins
- Git

### Clone Repository

```bash
git clone https://github.com/manav019-spec/SIT223_hospitalManagemnet.git
cd SIT223_hospitalManagemnet

▶️ Running the Application
Run with Docker
docker-compose up -d --build
docker-compose -f docker-compose.monitoring.yml up -d
Access

**Service	URL**
Frontend	http://localhost

Backend	http://localhost:5000

Health	http://localhost:5000/health

Metrics	http://localhost:5000/metrics

Prometheus	http://localhost:9090

Grafana	http://localhost:3000

**Run Tests**
cd Backend
npm install
npm test

 **Monitoring**
-Prometheus Alerts
-Alert	Severity	Condition	Description
-BackendDown	Critical	up == 0	Backend unreachable
-HighResponseTime	Warning	>500ms	Performance issue
-Grafana Login
---Username: admin
---Password: admin

**Security Findings**
Package	Severity	Issue	Status
react-router-dom <=6.30.2	HIGH	XSS redirect	Update required
lodash <=4.17.23	HIGH	Prototype pollution	Update required
follow-redirects <=1.15.11	MODERATE	Header leak	Update required
node-forge <=1.3.3	HIGH	Signature forgery	Update required
react-scripts	CRITICAL	Dev dependency	Acceptable

**Email Notifications**
✅ After Test stage
✅ After Security Scan
✅ On SUCCESS
❌ On FAILURE
```
 ---
### Author

Manav Jain

GitHub: https://github.com/manav019-spec
Email: manav4830.se24@chitkara.edu.in
University: Chitkara University
Unit: SIT223 — Professional Practice in IT

### License
This project is created for academic purposes as part of SIT223 at Deakin University.
