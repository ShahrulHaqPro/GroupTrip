# ✈️ GroupTrip — Collaborative Trip Planner

A full-featured **React Native + Expo** app for planning group trips. Real-time itinerary collaboration, voting, expense tracking, map view, and AI-powered activity suggestions.

---

## 📦 Tech Stack

| Layer | Tool |
|---|---|
| Framework | Expo SDK 51 (managed workflow) |
| Navigation | expo-router (file-based) |
| UI Library | react-native-paper (Material Design 3) |
| Backend | Supabase (Auth + Postgres + Realtime) |
| State | Zustand |
| Offline | AsyncStorage + sync queue |
| Maps | react-native-maps + OpenStreetMap tiles |
| AI | Groq Cloud (llama3-8b-8192) – free tier |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Create the project directory and copy all files in, then:
cd GroupTrip
npm install
```

### 2. Set up Supabase (free — no credit card)

1. Go to **https://supabase.com** → Sign up → New Project
2. Choose a name, region, and strong password. Wait ~2 min for provisioning.
3. In your project dashboard, click **SQL Editor** → New query
4. Paste the entire contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
5. Again open a New query
6. Paste the entire contents of `supabase/migrations/002_join_trip_by_invite_rpc.sql` and click **Run**
7. Enable Realtime:
   - Go to **Database → Replication**
   - Under "Supabase Realtime", toggle ON: `activities`, `activity_votes`, `expenses`, `trip_members`

#### Get your credentials:
- Settings → API → **Project URL** (e.g. `https://xxxx.supabase.co`)
- Settings → API → **anon / public** key

### 3. Set up Groq API key (optional but recommended)

1. Go to **https://console.groq.com** → Sign up (free)
2. API Keys → Create API Key → Copy it
3. Free tier: 10,000 tokens/day — plenty for demos

> **No key?** The app falls back to built-in static suggestions automatically.

### 4. Configure `app.json`

Open `app.json` and fill in the `extra` section:

```json
"extra": {
  "SUPABASE_URL": "https://your-project.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhb...",
  "GROQ_API_KEY": "gsk_..."
}
```

### 5. Run the app

```bash
npx expo start 
(or)
npm start
```

---

## 🗂️ Project Structure

```
GroupTrip/
├── app/
│   ├── _layout.js              # Root layout, theme provider
│   ├── index.js                # Auth redirect
│   ├── (auth)/
│   │   ├── _layout.js
│   │   ├── login.js            # Email/password login
│   │   └── register.js         # Sign-up
│   └── (app)/
│       ├── _layout.js
│       └── trips/
│           ├── index.js        # All trips list
│           ├── create.js       # New trip form
│           └── [id]/
│               ├── index.js    # Trip detail (4 tabs)
│               ├── add-activity.js
│               ├── add-expense.js
│               └── suggestions.js   # AI suggestions
├── src/
│   ├── components/
│   │   ├── ActivityCard.jsx
│   │   ├── ExpenseCard.jsx
│   │   └── VoteButtons.jsx
│   ├── services/
│   │   ├── supabase.js         # All DB operations
│   │   └── aiService.js        # Groq API
│   ├── store/
│   │   ├── authStore.js        # Zustand auth state
│   │   ├── themeStore.js        # Zustand theme state
│   │   └── tripStore.js        # Zustand trip/activity/expense state
│   └── utils/
│       ├── offlineSync.js      # AsyncStorage queue
│       └── theme.js        # Stored theme colors
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── app.json
├── babel.config.js
└── package.json
```

---

## 📱 Features Walkthrough

### Authentication
- Email/password sign-up and login via Supabase Auth
- Session persisted in AsyncStorage
- Auto-redirect to login if session expired

### Trips
- Create trip with title, destination, date range, optional budget
- Join a trip by entering a **6-character invite code**
- Each trip auto-generates a unique invite code on creation

### Itinerary (real-time)
- Add activities with: name, datetime, address, lat/lng, notes, estimated cost
- Activities update live for all members via Supabase Realtime
- Delete your own activities

### Voting
- 1–3 heart system per activity
- Tap 1, 2, or 3 hearts to vote; tap again to deselect
- Running total visible on each card

### Map View
- All activities with lat/lng coordinates shown as pins
- Uses **OpenStreetMap tiles** — no Google Maps API key required
- Tap markers to see activity name and address

### Expense Tracking
- Log expenses: description, amount, paid by (choose member), split among (multi-select)
- Per-person calculation shown automatically
- Balance summary: how much you owe or are owed
- Delete your own expenses

### AI Suggestions
- Tap the robot icon on the Itinerary tab → AI Suggestions screen
- Groq generates 5 activities tailored to your destination and dates
- Each suggestion shows: name, description, cost estimate, time of day
- One-tap to add any suggestion directly to your itinerary

### Offline Support
- Trip data cached in AsyncStorage
- Adding an activity while offline: stored in a queue with a DRAFT badge
- When connection restores, queue syncs to Supabase automatically

---

## 🗄️ Database Schema

```
profiles       id, email, name, avatar_url
trips          id, title, destination, start_date, end_date, budget, created_by, invite_code
trip_members   trip_id, user_id, role (owner|member)
activities     id, trip_id, name, datetime, lat, lng, address, notes, cost, created_by
activity_votes id, activity_id, user_id, vote_value (1-3)
expenses       id, trip_id, description, amount, paid_by, split_among (uuid[])
```

Row Level Security enforces that only trip members can read/write trip data.

---

## 🧪 Testing Checklist

- [ ] Create account → login
- [ ] Create a trip with dates and budget
- [ ] Share invite code with a second device/account → join trip
- [ ] Add an activity with location coordinates
- [ ] Vote with hearts on activities
- [ ] Add an expense; verify per-person split
- [ ] Check Map tab — pin appears on map
- [ ] Tap AI Suggestions → add a suggestion to itinerary
- [ ] Turn on airplane mode → add activity → turn off → verify sync

---

## ⚙️ Common Issues

| Issue | Fix |
|---|---|
| `Missing Supabase credentials` | Fill in `app.json → extra` fields |
| Map shows blank tiles | Normal on emulator sometimes; try on real device |
| AI returns fallback suggestions | Add a valid `GROQ_API_KEY` in `app.json` |
| Email not confirmed | Check spam, or disable email confirmation in Supabase Auth settings |
| `npx expo start` fails | Run `npm install` first; ensure Node 18+ |

### Disable email confirmation (for dev speed)
Supabase Dashboard → Authentication → Providers → Email → toggle off "Confirm email"

---

## 🔑 Free Tier Limits

| Service | Limit |
|---|---|
| Supabase DB | 500 MB |
| Supabase Realtime | 200 concurrent connections |
| Supabase Auth | Unlimited users |
| Groq Cloud | 10,000 tokens/day per key |

All sufficient for a working MVP with real users.

---

## 📄 License

GNU GPL V2.0
