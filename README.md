# Rumbo

Mobile app for leaders (*dirigentes*) of the **Comunidad de Nómadas Scout** branch of the Asociación Scouts de Colombia (ASC). It records the personal progression of Nómadas Scout under the Política Nacional de Programa de Jóvenes (PNPJ 2026) and lets leaders consult the competencies of the new educational model.

Course project for *Desarrollo de Aplicaciones para Dispositivos Móviles*. Pilot: Comunidad Westminster.

## Status

| Feature | Status |
|---|---|
| Backend schema, Row Level Security and normative catalog seed | Done |
| Leader sign-in with persistent session | Done |
| Nomad list, create, edit, retire/reactivate, delete | Done (in testing) |
| Light/dark theme following the device | Done (in testing) |
| Offline sync with PowerSync and conflict resolution | Planned (Dec 2026) |
| Progression records, badges and phase calculation | Planned (Dec 2026) |
| Competency browser | Planned (Dec 2026) |
| Normative chatbot (RAG over PNPJ and the Guía) | Planned (Dec 2026) |

The app currently talks to Supabase directly. PowerSync will replace the data-access implementation without changing the screens (see [Architecture](#architecture)).

## Tech stack

- [Expo](https://expo.dev) SDK 58 with Expo Router (routes in `src/app/`)
- TypeScript (strict mode)
- [Supabase](https://supabase.com): Postgres, Auth, Row Level Security
- [React Native Paper](https://oss.callstack.com/react-native-paper/) (Material Design 3)
- Planned: [PowerSync](https://www.powersync.com) for offline-first sync

Target platform: Android first; iOS towards the end of the project.

## Project structure

```
rumbo/
├── src/
│   ├── app/                  Screens and navigation (Expo Router)
│   │   ├── _layout.tsx       Providers, theme, protected routes
│   │   ├── sign-in.tsx
│   │   └── (app)/            Authenticated area
│   │       ├── index.tsx     Nomad list
│   │       └── nomads/       new.tsx, [id].tsx
│   ├── components/           Reusable UI components
│   ├── context/              Auth context (session + leader profile)
│   ├── features/             Feature modules: types, repository interface, implementation
│   └── lib/                  Supabase client, error mapping
└── supabase/
    ├── migrations/           Versioned SQL migrations
    ├── scripts/              Development utilities
    └── seed.sql              Normative catalog and pilot communities
```

## Architecture

- **Feature modules.** Each `features/<name>/` folder holds the domain model (`types.ts`), the data-access contract (`repository.ts`), its implementation (`supabase<Name>Repository.ts`) and a single entry point (`index.ts`).
- **Repository pattern.** Screens depend only on the repository interface. Moving to PowerSync means writing a new implementation and switching it in `index.ts`.
- **Security in the database.** Leaders only see and modify data of their own community. This is enforced by Row Level Security in Postgres, never by the UI alone.
- **Protected routes.** `Stack.Protected` exposes the authenticated area only when there is a session *and* the user is linked to a community in the `leader` table.

## Data model

| Group | Tables |
|---|---|
| Organization | `scout_group`, `community`, `leader` |
| Nomads | `nomad` |
| Normative catalog (read-only, seeded) | `growth_area`, `educational_priority`, `competency`, `performance_level`, `leader_action` |
| Progression (append-only) | `progression_record`, `applied_strategy`, `badge_progress` |

The progression phase (Aspirante, Caminante de los Bosques, Pionero de la Montaña, Visionario de los Ríos, Líder del Sol) is computed from badges per growth area, not stored.

The catalog is transcribed from the *Guía de Dirigente de Comunidad* (ASC): 6 growth areas, 22 educational priorities, 22 competencies, 3 performance levels and 14 leader actions.

## Getting started

### Prerequisites

- Node.js LTS and npm
- A Supabase project
- Expo Go on an Android device (a development build will be required once PowerSync is integrated)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` in the project root:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Use the publishable (or legacy anon) key. **Never** put the `service_role` key in the app: it bypasses Row Level Security.

### 3. Set up the database

Run in the Supabase SQL Editor, in this order:

1. `supabase/migrations/20261102180000_initial_schema.sql`
2. `supabase/migrations/20261102190000_rls_policies.sql`
3. `supabase/seed.sql`

In Authentication settings, disable public sign-ups: leader accounts are created by an administrator.

### 4. Create leaders

1. Create each user in **Authentication → Users → Add user**.
2. Link it to a community with the `insert into public.leader` template at the end of `supabase/seed.sql`, using the user's Auth id.

### 5. Run

```bash
npx expo start
```

Scan the QR code with Expo Go. Use `npx expo start -c` to clear the bundler cache if routes or styles look stale.

## Data protection

The app follows Colombian Law 1581 of 2012 as design constraints:

- Only Nomads registered in the ASC are recorded, with minimal data (first and last name).
- No sensitive data (health, guardians' contacts, ID documents) is stored.
- Deleting a Nomad permanently erases all of their progression data.
- No third-party advertising or analytics.

Pending institutional items (not solved in code): guardians' authorization, data-processing policy and international data transfer due to Supabase hosting.

## Conventions

- Code, comments, commit messages and technical docs in English; UI in Spanish.
- Scout domain terms without a faithful translation stay in Spanish (e.g. *rumbo*); see the glossary (pending).
- Schema changes are always versioned SQL migrations.