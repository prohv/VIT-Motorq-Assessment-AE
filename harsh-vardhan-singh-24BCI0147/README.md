# Stream Analytics Dashboard

A real-time video streaming analytics dashboard built with React + Prisma + PostgreSQL.

## Features

- **Real-time Active User Tracking** - Monitor concurrent viewers at any moment or time range
- **Date/Time Range Selection** - Interactive calendar and time picker pickers
- **Breakdown Analytics**:
  - By Country - Geographic distribution of viewers
  - By Device - Device type breakdown (desktop, mobile, smart TV, tablet)
  - By Video - Most-watched content
- **Activity Timeline** - Visual representation of user activity patterns
- **Auto-refresh** - Rebuild analytics data on demand

## Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Express.js
- **ORM**: Prisma 7 with PostgreSQL driver adapter
- **API**: RESTful endpoints with JSON responses

### Frontend
- **Framework**: React 19 with Vite
- **State Management**: TanStack Query v5
- **Charts**: Recharts
- **Styling**: Tailwind CSS with custom squircle design system
- **Icons**: Lucide React

## Project Structure

```
├── apps/
│   ├── api/                 # Backend application
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── seed.ts          # Seed script for demo data
│   │   └── src/
│   │       ├── controllers/     # API route handlers
│   │       ├── services/        # Business logic
│   │       └── app.ts           # Express server setup
│   └── web/                 # Frontend application
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── lib/             # API client
│       │   ├── App.tsx          # Main dashboard component
│       │   └── index.css        # Custom styles + squircle classes
│       └── public/
│           └── logo.svg         # App logo
├── package.json             # Monorepo root with concurrently
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- npm or bun

### Installation

1. **Clone and install dependencies:**
```bash
bun install
```

2. **Set up environment variables:**

Create `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stream_analytics"
PORT=5000
```

3. **Initialize database:**
```bash
bun run db:push
```

4. **Seed demo data:**
```bash
bun run db:seed
```

### Running the Application

Start both API and frontend servers:

```bash
bun run dev
```

This runs concurrently:
- **API**: http://localhost:5000
- **Web**: http://localhost:5173

Or run individually:

```bash
# API only
bun --filter api dev

# Frontend only  
bun --filter web dev
```

## API Endpoints

### Track Active Management

```
POST /api/track-active/build?limit=1000
```

Rebuilds the `track_active` table from raw events.

**Response:**
```json
{
  "success": true,
  "inserted": 150,
  "total": 200
}
```

### Active Users

```
GET /api/active-users/count?start=2025-06-15T00:00:00&end=2025-06-15T23:59:59
```

Count unique active users in a time range.

**Response:**
```json
{
  "count": 63
}
```

```
GET /api/active-users/at?x=2025-06-15T12:00:00
```

Count users active at a specific timestamp.

### Breakdowns

#### By Country
```
GET /api/active-users/by-country?start=2025-06-15T00:00:00&end=2025-06-15T23:59:59
```

Returns user count per country. Uses `track_active` table joined with `events` to get user's country.

**Response:**
```json
{
  "data": [
    { "country": "US", "count": 24 },
    { "country": "IN", "count": 21 },
    { "country": "UK", "count": 18 }
  ]
}
```

#### By Device
```
GET /api/active-users/by-device?start=...&end=...
```

Returns user count per device type (desktop, mobile, smart_tv, tablet).

**Response:**
```json
{
  "data": [
    { "device": "desktop", "count": 18 },
    { "device": "mobile", "count": 16 },
    { "device": "smart_tv", "count": 14 },
    { "device": "tablet", "count": 13 }
  ]
}
```

#### By Video
```
GET /api/active-users/by-video?start=...&end=...
```

Returns user count per video, includes video title from `content` table.

**Response:**
```json
{
  "data": [
    { "video_id": "uuid", "title": "Echoes of Tomorrow", "count": 4 },
    { "video_id": "uuid", "title": "Family Ties", "count": 3 }
  ]
}
```

### Prefix Sum Optimization

The `prefix_sum_table` provides O(1) range lookups for concurrency analytics:

- **Table**: Stores cumulative user counts per timestamp
- **Query**: `result = prefix[end] - prefix[start-1]`
- **Benefits**: Fast queries for any time range without scanning all events

Rebuild prefix sums:
```
POST /api/prefix-sum/rebuild
```

This aggregates hourly data and builds cumulative sums for efficient range queries.

## Database Schema

### Events Table
Stores all streaming events with user, content, and device information.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User identifier |
| content_id | UUID | Video/content identifier |
| timestamp | Timestamp | Event time |
| event_type | String | PLAY, PAUSE, SESSION_END, HEARTBEAT |
| country | String | User's country |
| device | String | Device type |
| video | String | Video title |

### Track Active Table
Computed table showing user activity at each timestamp.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User identifier |
| timestamp | Timestamp | Time of activity |
| active | Boolean | Is user actively watching |

### Content Table
Video metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | String | Video title |
| duration_seconds | Int | Video length |

## Track Active Logic

The `track_active` table is built from raw events using these rules:

1. **PLAY event** → sets user active = true
2. **PAUSE event** → sets user active = false
3. **SESSION_END event** → sets user active = false
4. **HEARTBEAT event** → inherits from last state (or true if first)
5. **30-second gap rule** → if >30s between events for a user, mark inactive
6. **SESSION_START event** → skipped (first event usually PLAY)

## Current State

On page load, the dashboard automatically fetches and displays live data from the database without requiring user interaction.

### Default Time Range
- **Start**: 2025-06-15 00:00 (dataset date)
- **End**: 2025-06-15 23:59

This ensures charts show substantial data immediately on load.

### Auto-fetch Behavior
1. Queries execute automatically when the page loads
2. TanStack Query manages caching and refetching
3. Loading spinners show during data fetch
4. Charts populate once data arrives

### Refetch on Apply
When user selects a new time range and clicks "Apply Filter":
1. All queries refetch with new parameters
2. Charts update with fresh data
3. Loading states display during fetch

## Scripts

### Frontend
```
VITE_API_URL=http://localhost:5000/api
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both API and web servers |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed demo data |