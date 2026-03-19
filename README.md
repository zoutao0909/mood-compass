# mood-compass

A mood tracking MVP built with Next.js + Prisma + SQLite.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- Recharts

## Run locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000

## Features (v0.2 - Phase 2)

### Core Features
- Add mood entries (score, tags, note)
- Edit and delete existing entries
- List recent entries with filtering

### Analysis
- Mood trend chart (line chart)
- Time range filters (7 days / 30 days / all)
- Top triggers (most frequent tags)
- Low mood warning (consecutive 3 days ≤ 4)

### Coming Next
- User authentication
- Data export
- Advanced insights
- Mobile app

## Project Structure

```
mood-compass/
├── src/
│   ├── app/
│   │   ├── api/mood/
│   │   │   ├── route.ts         # GET (list) & POST (create)
│   │   │   └── [id]/route.ts    # PUT (update) & DELETE
│   │   ├── layout.tsx
│   │   └── page.tsx             # Main UI
│   └── lib/
│       └── prisma.ts            # Prisma client
├── prisma/
│   └── schema.prisma            # Database schema
└── package.json
```

## License

MIT
