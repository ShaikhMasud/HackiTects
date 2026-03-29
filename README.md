# 🏥 WardWatch Clinical System
**A real-time, dynamic hospital ward occupancy and patient flow ecosystem designed to eradicate the disconnect between physical hospital reality and legacy record systems.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stack: MERN](https://img.shields.io/badge/Stack-MERN-green.svg)]()
[![Hackathon: HackiTects](https://img.shields.io/badge/Hackathon-HackiTects-black.svg)]()

---

## 🚀 The Challenge
In modern healthcare facilities, shift doctors and admitting nurses often have no live view of floor availability. The disconnect between pending admissions, cleaning pipelines, elective scheduling, and sudden discharges leads to **capacity friction, artificial bottlenecks, and hallway patient buffering.**

**WardWatch** solves this by centralizing the flow into a single, real-time, zero-reload dashboard that synchronizes administrative auditing, clinical treatment, and housekeeping logistics simultaneously.

---

## ✨ Key Features
- **🔴 Zero-Reload Live State (SSE)**: Built on a custom Node.js Server-Sent Events (SSE) backbone, ensuring every admission, discharge, and bed status change reflects across all connected client displays instantly without user intervention.
- **👩‍⚕️ Tri-Level Command Dashboards**:
  - **Nursing/Staff Mode**: Manage live admission queues, flag beds for housekeeping, process outbound discharges, and oversee the floor map.
  - **Clinical Doctor Profile**: Access customized patient rosters, dictate treatment condition markers, and manage patient-level escalation notes.
  - **Read-Only Audit Mode (Admin)**: A zoomed-out analytical view of entire hospital load mapping and capacity predictions.
- **⚕️ Admission Pipeline Queueing**: As patients arrive, they are triaged visually (Emergency/Urgent/Routine). When a nurse approves a pending admission, WardWatch dynamically routes them to the ideal available structural bed in fractions of a second.
- **🔄 Immutable Shift Handover Engine**: Seamlessly compile an exact live snapshot of the ward (total capacity, active escalations, incoming/outgoing flow, and assigned personnel). With one click, this snapshot is frozen into a permanent, sharable document, fully exportable to PDF layout for continuity logging.
- **🚨 Autonomous Escalation Sentinels**: Backend chron-jobs natively monitor data anomalies, highlighting delayed discharges or excessive stay-times, bubbling them up instantly as actionable UI alerts out of the noise.

---

## 🛠️ Technology Stack
- **Frontend Layer**: React 18 / Vite, TailwindCSS (Clinical Design System Grid), Lucide Icons, React-to-Print.
- **Event Mesh**: Native Server-Sent Events (SSE) via REST API streams.
- **Backend Architecture**: Node.js + Express 4.x.
- **Data Persistence**: MongoDB + Mongoose Object Modeling.
- **Authentication**: JWT Stateless Tokens + Bcrypt Encryption.

---

## 🏃 Initialization Guide

### 1. Pre-Requisites
- Node.js Environment (v16.x or newer)
- Active MongoDB Community Server / Atlas URI Instance

### 2. Bootstrapping the Backend (`/server`)
```bash
cd server
npm install
```
Configure your `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/wardwatch
JWT_SECRET=your_super_secret_key_here
```
Run the API mesh:
```bash
npm run start
# For development auto-reloads: npm run dev
```

### 3. Rendering the Client (`/client`)
```bash
cd client
npm install
npm run dev
```
The application mounts optimally at `http://localhost:5173`. 

---

## 🎯 Architecture Philosophy & Design Patterns
WardWatch isn't built merely as a data-entry product; it actively respects the fatigue of healthcare workers. 
- **Dark-Contrast Aesthetic Framing**: Extensive usage of sharp monochromatic grays, ultra-bold Inter typography, and selective high-signal color accents (Red for Critical, Blue for Release, Orange for Queue) ensures visual fatigue is minimized under harsh fluorescent hospital lighting.
- **Fail-Gracefully Rendering**: All empty tables ("NA", "TBD") are specifically targeted with localized semantic fallbacks ("Unassigned", "Pending") to keep the interface sounding definitive.
- **API Modularity**: Micro-controllers manage separate domain concerns (`patientController`, `bedController`, `handoverController`) unified under a master authentication perimeter.

---

### *Authored for HackiTects Hackathon Submission — SDG 3: Good Health & Well-Being*