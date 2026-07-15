# BookSlot Frontend

A **Next.js 16** (App Router) frontend for the BookSlot appointment booking platform.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework & routing |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Redux Toolkit | Global state management |
| React Redux | Redux binding for React |

---

## Color System

All UI elements follow a strict 4-color brand palette:

| Token | Hex | Usage |
|---|---|---|
| Primary | `#027B51` | Buttons, links, accents, success toasts |
| Dark Background | `#0D1814` | Auth page left panel, dark toasts |
| White | `#ffffff` | Form panels, cards, backgrounds |
| Black | `#111111` | Body text |

---

## Authentication Flow

Authentication is managed entirely by **Redux** (no React Context or Cookies):

1. **Login / Register** pages call the backend API (`/api/auth/login` or `/api/auth/register`).
2. On success, the `setCredentials` Redux action stores `{ token, email, name, role }` in:
   - Redux state (in-memory, reactive)
   - `localStorage` (persisted across page refreshes)
3. On every page load, the root page dispatches `loadCredentials` which re-hydrates Redux from `localStorage`.
4. **Route Guards**:
   - If no token is found → redirect to `/login`
   - If already authenticated and visiting `/login` or `/register` → redirect to `/`

### Stored Keys (localStorage only — never cookies)
```
token   → JWT bearer token
email   → Logged in user's email
name    → Logged in user's full name
role    → "owner" | "customer"
```

---

## Redux Store Structure

```
store
├── auth (authSlice)
│   ├── token
│   ├── email
│   ├── name
│   ├── role
│   └── isAuthenticated
└── toast (toastSlice)
    └── toasts[]
```

### Key Redux Actions

| Action | Description |
|---|---|
| `setCredentials` | Saves auth data to Redux + localStorage |
| `loadCredentials` | Hydrates Redux from localStorage on mount |
| `clearCredentials` | Logs out — clears Redux + localStorage |
| `addToast` | Displays a toast notification |
| `removeToast` | Dismisses a toast by ID |

---

## Project Structure

```
src/
├── app/
│   ├── login/page.tsx        # Login page (split-screen)
│   ├── register/page.tsx     # Register page (split-screen, role selection)
│   ├── page.tsx              # Home (/) - protected, role-based dashboard
│   ├── layout.tsx            # Root layout (Redux + Toast providers)
│   └── globals.css           # Global styles and animations
├── components/
│   ├── ToastContainer.tsx    # Toast notification UI (reads from Redux)
│   ├── CustomerDashboard.tsx # Dashboard for customer role
│   └── OwnerDashboard.tsx    # Dashboard for owner role
└── redux/
    ├── store.ts              # Redux store
    ├── hooks.ts              # Typed useAppDispatch / useAppSelector
    ├── ReduxProvider.tsx     # Client-side Redux Provider
    └── slices/
        ├── authSlice.ts      # Auth state slice
        └── toastSlice.ts     # Toast state slice
```

---

## UX Rules

- ✅ **No `alert()`, `confirm()`, or `prompt()`** — all feedback via Toast system
- ✅ **Loading spinners** on all form submit buttons while awaiting API
- ✅ **Lazy loading** — dashboards loaded with `next/dynamic` to split the JS bundle
- ✅ **Split-screen layout** — auth pages divided 50/50 with branding on left, form on right
- ✅ **Role-based content** — Home route shows `CustomerDashboard` or `OwnerDashboard` based on stored role
- ✅ **No useContext** — all state managed by Redux slices

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Ensure the backend is running on `http://localhost:3000` (or update `NEXT_PUBLIC_API_URL` in `.env`).

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```
