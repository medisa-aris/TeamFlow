# TeamFlow: Next.js BFF Refactoring Requirements

## Executive Summary
This document outlines the architectural requirements and execution plan for migrating the **TeamFlow** client-side React application into a **Next.js (App Router)** framework using a **Backend-For-Frontend (BFF)** pattern. 

The primary goals of this refactor are:
1. **Security:** Eliminate XSS vulnerabilities by moving JWT storage from `localStorage` to secure, HttpOnly server cookies.
2. **Maintainability:** Dismantle the `App.jsx` "God Component" by adopting Next.js file-based routing and separating concerns.
3. **Performance:** Reduce client-side data over-fetching and eliminate visual loading spinners using Server Components and advanced caching (React Query).

---

## 1. Target Directory Structure
The monolithic `.jsx` files (`pages1.jsx`, `pages2.jsx`, `api.jsx`, etc.) will be broken down into the following Next.js standard structure:

```text
📦 teamflow-web
 ┣ 📂 src
 ┃ ┣ 📂 app                  # 1. FILE-BASED ROUTING & BFF SERVER
 ┃ ┃ ┣ 📂 (auth)             
 ┃ ┃ ┃ ┗ 📂 login
 ┃ ┃ ┃   ┗ 📜 page.jsx       # Replaces <LoginPage />
 ┃ ┃ ┣ 📂 api                # 2. THE BFF LAYER
 ┃ ┃ ┃ ┣ 📂 auth
 ┃ ┃ ┃ ┃ ┣ 📜 login/route.js # Handles login, sets HttpOnly cookies
 ┃ ┃ ┃ ┃ ┗ 📜 logout/route.js
 ┃ ┃ ┃ ┗ 📂 proxy            
 ┃ ┃ ┃   ┗ 📜 [...path]/route.js # Proxies Next.js calls to NestJS with secure token
 ┃ ┃ ┣ 📂 dashboard
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <Dashboard />
 ┃ ┃ ┣ 📂 mytodo
 ┃ ┃ ┃ ┣ 📜 page.jsx         # Replaces <MyTodo />
 ┃ ┃ ┃ ┗ 📂 [id]             
 ┃ ┃ ┃   ┗ 📜 page.jsx       # Replaces <TodoDetail />
 ┃ ┃ ┣ 📂 pending
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <PendingApproval />
 ┃ ┃ ┣ 📂 approval
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <ApprovalQueue />
 ┃ ┃ ┣ 📂 teamtodo
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <TeamTodo />
 ┃ ┃ ┣ 📂 laporan
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <Laporan />
 ┃ ┃ ┣ 📂 selesai
 ┃ ┃ ┃ ┗ 📜 page.jsx         # Replaces <Selesai />
 ┃ ┃ ┣ 📜 layout.jsx         # Global layout (Header, NavRail, ToastProvider)
 ┃ ┃ ┗ 📜 globals.css        # Extracted CSS from index.html
 ┃ ┃
 ┃ ┣ 📂 components           # 3. UI & FEATURE COMPONENTS
 ┃ ┃ ┣ 📂 layout             # Header.jsx, NavRail.jsx
 ┃ ┃ ┣ 📂 ui                 # Button.jsx, Card.jsx, Badge.jsx, Dialog.jsx, icons.jsx
 ┃ ┃ ┗ 📂 features           # AddTodoPanel.jsx, TodoCard.jsx, UserEditDialog.jsx
 ┃ ┃
 ┃ ┣ 📂 hooks                # 4. LIFECYCLE & BACKGROUND TASKS
 ┃ ┃ ┣ 📜 useToasts.js
 ┃ ┃ ┣ 📜 useTodoEngine.js   # Extracts the 1000ms setInterval logic
 ┃ ┃ ┗ 📜 useSSE.js          # Server-Sent Events connection logic
 ┃ ┃
 ┃ ┣ 📂 lib                  # 5. UTILITIES & API CLIENTS
 ┃ ┃ ┣ 📜 apiClient.js       # Replaces window.API (points to Next.js /api/proxy)
 ┃ ┃ ┣ 📜 utils.js           # fmtHMS, countWords, date formatters (from data.jsx)
 ┃ ┃ ┗ 📜 queryClient.js     # React Query setup
 ┃ ┃
 ┃ ┗ 📂 store                # 6. CLIENT STATE
 ┃   ┗ 📜 uiStore.js         # Zustand: theme, compact rail, notifOpen
 ┃
 ┣ 📜 middleware.js          # Route protection (checks HttpOnly cookie)
 ┣ 📜 next.config.js
 ┗ 📜 .env.local             # NEXT_PUBLIC_BASE_URL, NESTJS_INTERNAL_URL
```

---

## 2. Security & BFF Implementation (Critical)

**Current Anti-Pattern:** The JWT is stored in `localStorage.setItem("tf_access", ...)` and attached via client-side fetch.
**New Architecture:** The browser never touches the JWT.

1. **Authentication Route (`app/api/auth/login/route.js`):**
   * Receives `{ email, password }` from the client.
   * Fetches the NestJS backend `POST /auth/login`.
   * Extracts `accessToken` and `refreshToken`.
   * Sets them as secure cookies using `cookies().set('tf_access', token, { httpOnly: true, secure: true, sameSite: 'lax' })`.
   * Returns safe user profile data to the client.

2. **API Proxy (`app/api/proxy/[...path]/route.js`):**
   * Acts as a secure middleman.
   * Client calls `/api/proxy/todos`.
   * Next.js intercepts, reads the `tf_access` HttpOnly cookie, attaches it as an `Authorization: Bearer` header, and forwards the request to the NestJS backend.

3. **Middleware (`middleware.js`):**
   * Intercepts all page requests (e.g., `/dashboard`).
   * If the `tf_access` cookie is missing, redirects the user to `/login`.

---

## 3. Routing Migration

Remove the `const [route, setRoute] = useState("dashboard")` state machine. Map existing states to Next.js URLs using `next/navigation`.

| Current App State | Next.js URL Path | Key Change Needed |
| :--- | :--- | :--- |
| `go("dashboard")` | `/dashboard` | Use `useRouter().push('/dashboard')` |
| `go("mytodo")` | `/mytodo` | Use `useRouter().push('/mytodo')` |
| `go("detail", id)`| `/mytodo/[id]` | Access ID via `useParams().id` |
| `go("pending")` | `/pending` | Use `useRouter().push('/pending')` |
| `go("approval")` | `/approval` | Use `useRouter().push('/approval')` |
| `go("laporan")` | `/laporan` | Use `useRouter().push('/laporan')` |

*Update `NavRail.jsx`:* Replace `active={route === it.key}` with a check against `usePathname()`.

---

## 4. State Management & Data Fetching

**Current Anti-Pattern:** Overloading `AppContext` with massive data arrays (`todos`, `approvals`, `team`, etc.) and using `useEffect` with `setInterval` for polling.

1. **Replace `window.API` with TanStack React Query:**
   * Remove manual `loadTodos`, `loadApprovals`, etc., from the global context.
   * Each page fetches its own data using hooks like `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })`.
   * React Query handles caching, deduplication, and loading states automatically.

2. **Dismantle `AppContext`:**
   * Move UI states (`theme`, `compact`, `notifOpen`) to a lightweight **Zustand** store.
   * Move user profile state (`me`, `role`, `isCEO`) to a specialized Auth Context or Zustand store initialized by the layout.

3. **Real-Time Data (SSE):**
   * Create a global `useSSE` hook mounted in the root `layout.jsx`.
   * Instead of manually triggering data reloads on SSE events, call `queryClient.invalidateQueries({ queryKey: ['todos'] })` to let React Query cleanly update the cache in the background.

---

## 5. Background Tasks & Timers

**Current Anti-Pattern:** A massive `setInterval` runs every 1000ms inside the root `App.jsx`, checking times, triggering notifications, and making API calls.

1. **Extract `useTodoEngine` Hook:**
   * Move the F1 (Browser Notifications) and F2 (Auto-Stop Task) logic into a dedicated custom hook (`hooks/useTodoEngine.js`).
   * Mount this hook at the layout level.
   * Provide it access to the React Query cache so it can read running todos without triggering global UI re-renders every second.

---

## 6. Styling Refactor

1. **CSS Extraction:**
   * Move the ~500 lines of `<style>` contents from `index.html` into `src/app/globals.css`.
2. **Theme Management:**
   * Implement `next-themes` to handle the `data-theme="dark"` attribute on the `<html>` tag. This prevents the "flash of light mode" during SSR hydration.

---

## 7. Execution Phases

* **Phase 1: Foundation & UI Primitives**
  * Initialize Next.js project.
  * Port CSS to `globals.css`.
  * Migrate dummy components (`Card`, `Btn`, `Icons`, `TextBox`) to `src/components/ui`.
* **Phase 2: The Security Layer (BFF)**
  * Build the `/api/auth/login` Route Handler.
  * Build the `/api/proxy` Route Handler for NestJS communication.
  * Set up `middleware.js` for route protection.
* **Phase 3: Page Architecture**
  * Create folder structures for all pages (`/dashboard`, `/mytodo`, etc.).
  * Implement the global `layout.jsx` (Header, NavRail).
* **Phase 4: Data Integration**
  * Set up TanStack Query.
  * Migrate API calls from `api.jsx` into React Query custom hooks.
  * Wire up the pages to display actual data.
* **Phase 5: Real-time & Timers**
  * Abstract the `setInterval` into `useTodoEngine`.
  * Port the `window.API.SSE.connect` logic into a background hook to invalidate React Query caches.