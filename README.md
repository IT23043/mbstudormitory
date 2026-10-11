# MBSTU Dormitory - University Hall Management System

> **Web Application Development — Final Lab Project**  
> **Course:** Web Application Development Lab  
> **Institution:** Mawlana Bhashani Science and Technology University (MBSTU)  
> **Technology Stack:** HTML5, CSS3, JavaScript (ES6+), JSON, Bootstrap 5.3  
> **Deployment Target:** GitHub Pages (100% Static, Zero Node.js Requirement)

---

## Live Demo & Presentation Links
- **Live Website (GitHub Pages):** Deployable with 1-click on GitHub Pages (`https://<username>.github.io/<repo>/`)
- **PowerPoint Presentation Deck (Task 4):** [`MBSTU_Dormitory_Presentation.pptx`](file:///d:/environment/Lab%20Final/MBSTU_Dormitory_Presentation.pptx) (15-slide 16:9 presentation)
- **Markdown Presentation Slides Deck:** See [`SLIDES.md`](file:///d:/environment/Lab%20Final/SLIDES.md)

---

## Project Overview & Problem Statement
Residential hall life is at the center of student life at public universities in Bangladesh like MBSTU. However, traditional management systems are constrained by:
1. **Paper Meal Coupon Wastage & Lines:** Students queue at mess counters daily to purchase paper tokens.
2. **Kitchen Unpredictability:** Mess cooks cannot anticipate how many meals to prepare, causing food shortages or heavy wastage.
3. **Opaque Seat Allocation:** Students have no live visibility into which rooms and beds are vacant across halls.
4. **Communication Gaps:** Hand-written paper notices on hall walls often get missed.

**MBSTU Dormitory** solves this by providing a unified digital ecosystem featuring **everyday 3x online meal tokens (Breakfast, Lunch, Dinner)**, an **interactive visual room & bed matrix**, and **role-based administrative governance** for students and hall provosts.

---

## Covered Residential Halls of MBSTU

### Male Residential Halls (4)
1. **Jananeta Abdul Mannan Hall** (Capacity: 420 beds)
2. **Shaheed Osman Hadi Hall** (Capacity: 400 beds)
3. **Shahid Ziaur Rahman Hall** (Capacity: 450 beds)
4. **Shaheed Abrar Fahad Hall** (Capacity: 380 beds)

### Female Residential Halls (3)
1. **Alema Khatun Bhashani Hall** (Capacity: 420 beds)
2. **Shahid Janoni Jahanara Imam Hall** (Capacity: 460 beds)
3. **Begum Fazilatunnessa Zoha Hall** (Capacity: 390 beds)

> **Gender-Aware Hall Eligibility:** Male students can only view, register, and book meals at Male halls; Female students are strictly matched with Female halls.

---

## Key System Features

### 1. Everyday Online Meal Token (3 Times Daily)
- **3 Dining Cycles:**
  - **Morning (Breakfast):** 07:30 AM – 09:30 AM (Cutoff: 07:00 AM)
  - **Noon (Lunch):** 01:00 PM – 03:00 PM (Cutoff: 11:30 AM)
  - **Night (Dinner):** 08:00 PM – 10:00 PM (Cutoff: 06:30 PM)
- **Tariff Differentiation:**
  - **Permanent Residents:** Subsidized rates (Morning: 25 ৳, Noon: 50 ৳, Night: 55 ৳)
  - **Non-Residents / Guests:** Standard rates (Morning: 35 ৳, Noon: 70 ৳, Night: 75 ৳)
- **Digital Token Passes:** Generates an authentic ticket card complete with dynamic SVG QR code, serial number, and single-click print/PDF voucher.
- **Cancellation & Refunds:** Students can cancel prior to cutoffs with automated refund back to their Campus Wallet.
- **Authority Kitchen Counter Scanner:** Real-time headcount forecasting and 1-click token redemption verification.

### 2. Live Seat Matrix & Online Application
- **Visual Room Matrix:** Floor-by-floor interactive room layout showing Bed A, B, C, D in green (Vacant) or slate (Occupied).
- **"When Can I Apply?" Portal:** Clear eligibility thresholds (CGPA ≥ 2.75, distance priority, no disciplinary violations), timeline schedules, and circular links.
- **Online Application Form:** Students apply by submitting academic session, CGPA, home district distance, family income, and statement of need.
- **Provost Evaluation Workflow:** Provosts evaluate applicants, approve seats, assign Room and Bed, or place on the waiting list.

### 3. Institutional Multi-Role Access Control
- **Email Validation:** Accounts strictly verified with institutional domain containing `mbstu.acu.bd` (or `mbstu.ac.bd`).
- **Student Dashboard:** Profile details, room allocation, active meal tokens today, wallet recharge simulator (bKash/Nagad), and maintenance ticketing.
- **Provost / Teacher Command Center:** Overview of all 7 halls, kitchen headcounts, pending application approvals, and circular publishing.

### 4. Client-Side JSON Database Architecture
- Structured initial dataset loaded from `data/default_data.json`.
- Full CRUD operations persisted directly into `localStorage`.
- **Zero Node.js dependency:** Runs on any static web server and deploys seamlessly on GitHub Pages.
- **Database Backup & Reset:** Single-click "Export JSON" and "Factory Reset" buttons to showcase database handling during academic assessment.

---

## Lab Evaluator Test Credentials (1-Click Autofill Available)

| Role | Email | Password | Resident Status / Designation | Hall Assigned |
| :--- | :--- | :--- | :--- | :--- |
| **Male Student** | `student.male@mbstu.acu.bd` | `student123` | Permanent Resident (Room 304, Bed B) | Shaheed Abrar Fahad Hall |
| **Female Student** | `student.female@mbstu.acu.bd` | `student123` | Permanent Resident (Room 201, Bed A) | Alema Khatun Bhashani Hall |
| **Guest Student** | `guest.student@mbstu.acu.bd` | `guest123` | Non-Resident / Attached | Jananeta Abdul Mannan Hall |
| **Hall Provost** | `provost@mbstu.acu.bd` | `admin123` | Provost & Professor | Shaheed Abrar Fahad Hall |
| **Assistant Provost** | `teacher.jamh@mbstu.acu.bd` | `admin123` | Assistant Provost | Jananeta Abdul Mannan Hall |

---

## Project Directory Structure

```text
├── index.html                  # Landing page with hall directory & live statistics
├── login.html                  # Institutional login with role switcher & demo autofill
├── register.html               # Student registration with gender-based dynamic hall filter
├── student-dashboard.html      # Student portal: wallet, today's tokens, complaints
├── meal-tokens.html            # Everyday 3x meal booking, digital QR pass, refund
├── seat-application.html       # Visual room-bed matrix, eligibility, application form
├── notice-board.html           # Public & student notices board with filters
├── admin-dashboard.html        # Provost command center with global hall metrics
├── admin-seats.html            # Authority seat evaluation & bed assignment
├── admin-meals.html            # Dining counter verifier & kitchen volume planner
├── admin-notices.html          # Official circular & announcement publisher
├── MBSTU_Dormitory_Presentation.pptx # Task 4 PowerPoint 15-slide presentation deck
├── SLIDES.md                   # Markdown presentation slides transcript
├── css/
│   └── style.css               # Clean minimal styling (Navy, Slate, White palette)
├── js/
│   ├── db.js                   # JSON database layer, CRUD, export/import, persistence
│   ├── auth.js                 # Authentication service, institutional email guards
│   └── app.js                  # Shared UI helpers, toast manager, SVG QR generator
└── data/
    └── default_data.json       # Pre-seeded JSON database of halls, users, tokens
```

---

## How to Run Locally

Because this project is built with vanilla HTML, CSS, JavaScript, and JSON:
1. Double-click [`index.html`](file:///d:/environment/Lab%20Final/index.html) to open it in your browser.
2. Or run any local static server:
   ```powershell
   python -m http.server 8080
   ```
   and visit `http://localhost:8080/index.html`.

---

## How to Deploy to GitHub Pages (Task 3)

1. **Initialize Git & Commit:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MBSTU Dormitory"
   ```
2. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/<your-username>/mbstu-dormitory.git
   git branch -M main
   git push -u origin main
   ```
3. **Enable GitHub Pages:**
   - Go to your repository on GitHub &rarr; **Settings** &rarr; **Pages**.
   - Under **Build and deployment** &rarr; **Branch**, select `main` and root `/ (root)`.
   - Click **Save**.
   - Your website will be live in ~1 minute at: `https://<your-username>.github.io/mbstu-dormitory/`!

---

