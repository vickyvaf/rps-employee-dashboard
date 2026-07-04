# Employee Dashboard

A polished, responsive, and high-performing **Employee Dashboard** application built with **React**, **TypeScript**, **Tailwind CSS**, and **TanStack React Query**. The application features client-side API mocking via **Mock Service Worker (MSW)** and incorporates an AI-driven announcement summarization feature.

---

## 🧑‍💻 Preview
https://github.com/user-attachments/assets/042be9c6-70be-4ef1-9471-c765002065d4

---

## 🚀 Key Features

- **📊 Dashboard Overview**: A central hub showing daily summaries (total employees, present today, pending leaves), quick actions, and recent announcements.
- **📅 Daily Attendance Records**: Comprehensive tabular attendance tracker with colored status indicators (Present, Late, Absent, On Leave).
- **🌴 Leave Request & Summary**: Balance counters (*Total, Used, Remaining*) with a request submission form. Responsive styling displays form inline on desktop and opens in an elegant modal on mobile.
- **🔍 Team Directory**: Searchable directory filtered by name and department, with full state synchronization in the browser's URL query parameters (`?q=...&dept=...`) for shareable search states.
- **📢 Announcements & AI Summarizer**: Company feed with a "Summarize with AI" button that generates a key bullet-point summary of long posts using a simulated REST AI endpoint.
- **🌓 Light / Dark Mode Toggle**: Persistent theme switcher that syncs with `localStorage` and respects the user's OS-level preferred color scheme (`prefers-color-scheme`).
- **📱 Native-Like Mobile Layout**: Responsive navigation layout that transforms from a desktop sidebar to a fixed bottom icon navigation bar on smaller viewports.

---

## 🏗️ System Architecture

The application is structured as a decoupled SPA (Single Page Application) with clear boundaries:

```mermaid
graph TD
  A[React Router DOM Routing] --> B[App Component UI]
  B --> C[shadcn/ui Custom Tailwind Components]
  B --> D[React Query Hooks & Mutations]
  D --> E[Axios HTTP Client]
  E -.-> F[Mock Service Worker - MSW Browser Interceptor]
  F -.-> G[InMemory Mock Database]
```

### 📁 Directory Structure

```text
├── public/
│   └── mockServiceWorker.js   # Service worker for local API interception
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios client instance configuration
│   │   └── queries.ts         # TanStack Query React custom hooks & mutation bindings
│   ├── components/
│   │   └── ui/                # shadcn/ui default layout components
│   ├── mocks/
│   │   ├── browser.ts         # Setup for local MSW browser runtime worker
│   │   └── handlers.ts        # Endpoint route definitions & local in-memory DB state
│   ├── App.tsx                # Central routing table, page layouts, and state container
│   ├── index.css              # Global styles and Tailwind directives configuration
│   └── main.tsx               # Entry mount with conditional MSW initialization code
```

### 1. View & UI Layer
- **Vite & React 19 + TypeScript**: Offers fast Hot Module Replacement (HMR) and compile-time type-safety.
- **Tailwind CSS**: Modern utility classes built exclusively on standard design tokens (`text-xs`, `min-h-20`, `max-w-48`) without arbitrary values to preserve stylesheet cleanliness.
- **shadcn/ui Default Components**: Standard components ([table.tsx](file:///Users/vickyadifirmansyah/Documents/Projects/employee-dashboard/src/components/ui/table.tsx), [card.tsx](file:///Users/vickyadifirmansyah/Documents/Projects/employee-dashboard/src/components/ui/card.tsx), [button.tsx](file:///Users/vickyadifirmansyah/Documents/Projects/employee-dashboard/src/components/ui/button.tsx), [input.tsx](file:///Users/vickyadifirmansyah/Documents/Projects/employee-dashboard/src/components/ui/input.tsx)) mapped to standard theme classes (e.g. `border-border`) to ensure contrast accessibility.

### 2. State & Cache Layer
- **React Router DOM v6**: Powers page routing (`/overview`, `/attendance`, `/leaves`, `/directory`, `/announcements`) and handles fallback redirection on unregistered paths.
- **TanStack React Query v5**: Manages asynchronous server cache, polling, query caching, loading indicators, and mutation side-effects (such as automatically invalidating leave requests or AI summaries).
- **Axios client**: Configured with a default base URL to centralize API requests.

### 3. Server Mocking Layer
- **Mock Service Worker (MSW)**: Registers a Service Worker interceptor on `mockServiceWorker.js`. It catches all outgoing Axios API requests and responds with mock payload data, eliminating the need to spin up or host a separate backend server.

---

## 🛠️ Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [pnpm](https://pnpm.io/) (or `npm`) installed.

### Steps
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd employee-dashboard
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the local development server**:
   ```bash
   pnpm run dev
   ```
   Open your browser and navigate to `http://localhost:5173/overview`.

4. **Build for production**:
   ```bash
   pnpm run build
   ```
   The compiled assets will be outputted to the `dist/` directory.
