# Application Overview

## What This App Is

A project monitoring dashboard for **Engineering Projects (India) Ltd.** It tracks infrastructure and construction projects across Indian states, giving engineers and managers a single place to see project status, financials, and schedule deviations.

---

## Two Main Screens

### 1. Dashboard (Monitoring)

A read-only overview of all projects.

**Status Bar** — A row of cards at the top showing:
- Total Projects
- Active Projects
- Completed
- In Progress
- Delayed Projects

Each card shows the project count, average completion percentage, and financial value. Clicking a card filters the views below. The In Progress and Delayed cards expand to reveal sub-cards that break projects down by delay severity: On Time, Warning, Serious, and Critical.

**Charts** — Six interactive charts:
- **Region-wise** — project count by state
- **Physical Progress** — target vs. actual completion percentage by region
- **Financial Progress** — MBook, Billed, and Paid amounts as a percentage of total project value
- **Schedule Status** — active projects grouped by delay severity
- **Category-wise** — project count by category
- **Timeline Trend** — completed and active projects over time with financial outflow

Every chart can be toggled between bar and pie views. Clicking a bar or slice filters the dashboard by that dimension. A selection bar at the top shows active filters as removable chips.

**Project Views** — Below the charts, projects can be displayed in:
- **Tile View** — compact cards with key metrics
- **Table View** — a detailed spreadsheet-style list
- **Card View** — expanded cards with full project information

Clicking any project opens a details modal.

### 2. Maintenance (Data Entry)

For creating and updating project records.

- **Create New Project** — opens a form to enter project name, description, state, district, category, subcategory, start date, duration, project value, MBook entry, manager, and remarks.
- **Edit Project** — opens the same form pre-filled with the project's current values.
- **Track Update** — logs a new tracking entry for one of five deviation types:
  - Extension / Delay
  - Quantity
  - Schedule Deviation
  - Specification
  - Price

Each tracking entry captures the deviation value, officer name, and remarks.

---

## Filtering

A filter drawer (opened from the toolbar) narrows projects by:
- State
- District
- Category
- Subcategory
- Delay status
- Start month / End month range

Quick filters are also available by clicking status cards and chart bars. A "Clear All" button resets every filter at once.

---

## Project Details Modal

Opened from any project view, this modal shows:
- **Header** — project name, code, sequence number, manager, state, district, category, and dates
- **Financial Summary** — Total Project Value, MBook Entry, Billed Amount, Paid Amount, and Balance
- **Deviations** — expandable rows for each tracking type showing the latest deviation value and a full history log of all entries

---

## Data and Security

- All project data is stored in a **Supabase** database with row-level security enabled on every table.
- The app reads projects, work orders, schedules, tracking entries, and specs.
- The app writes new projects and tracking updates.
- Sensitive columns (like delay status) are database-controlled and cannot be written directly by the app.

---

## Technology

- **React** with **TypeScript** for the user interface
- **Tailwind CSS** for styling
- **Recharts** for interactive charts
- **Lucide** for icons
- **Supabase** for the database and data access
- **Vite** as the build tool
