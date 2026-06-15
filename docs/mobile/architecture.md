# Mobile Architecture

Target layout for `apps/mobile/src/`. Presentation only — business rules stay in `packages/domain`.

## Layer diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  Screens & navigation (features/*/screens, navigation/)      │
└───────────────────────────┬─────────────────────────────────┘
                            │ uses
┌───────────────────────────▼─────────────────────────────────┐
│  UI design system (ui/atoms, molecules, organisms, templates)│
└───────────────────────────┬─────────────────────────────────┘
                            │ uses
┌───────────────────────────▼─────────────────────────────────┐
│  API adapters (api/) + shared Zod schemas (packages/shared)  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────────┐
│  NestJS API (apps/api)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Folder layout

```text
apps/mobile/src/
├── ui/
│   ├── atoms/              # Button, Text, Icon, Spinner, Badge
│   ├── molecules/          # FormField, ListItem, OccurrenceCard
│   ├── organisms/          # OccurrenceList, MapViewport, AuthForm
│   ├── templates/          # ScreenShell, TabLayout, ModalLayout
│   └── theme/              # colors, spacing, typography tokens
├── i18n/
│   ├── locales/
│   │   ├── en.json
│   │   └── pt-BR.json
│   ├── keys.ts             # Typed key constants (English identifiers)
│   ├── translate.ts        # t(key, params)
│   └── locale.ts           # resolveLocale, persist preference
├── navigation/
│   ├── root-navigator.tsx
│   ├── auth-stack.tsx
│   ├── main-tabs.tsx
│   └── linking.ts          # Deep link config
├── api/
│   ├── client.ts           # fetch wrapper, base URL, correlation id
│   ├── auth-storage.ts     # SecureStore: session + refresh tokens
│   ├── errors.ts           # ApiError, map status → i18n key
│   └── routes/             # One module per API group
│       ├── sessions.ts
│       ├── occurrences.ts
│       ├── validation.ts
│       ├── media.ts
│       ├── identity.ts
│       ├── auth.ts
│       └── user-accounts.ts
└── features/
    ├── bootstrap/          # Ghost session on first launch
    ├── map/                # MapLibre map + occurrence pins
    ├── occurrences/        # Create, detail, comments
    ├── validation/         # Confirm / deny votes
    ├── media/              # Upload flow (presigned slots)
    ├── identity/           # Mode switch, rotate
    ├── account/            # Register, login, profile, LGPD erasure
    └── settings/           # Locale, privacy copy, about
```

## Vertical slice rules

| Rule | Detail |
|------|--------|
| **Feature owns screens** | `features/occurrences/screens/create-occurrence-screen.tsx` |
| **Shared UI in `ui/`** | Reuse across features; no feature imports from another feature's screens |
| **API calls via `api/routes/*`** | Screens call hooks; hooks call route adapters — no raw `fetch` in components |
| **No domain imports in atoms** | Atoms are presentational; organisms may use feature hooks |
| **Types from shared** | Request/response shapes from `packages/shared` Zod infer or API spec types |

## State management (planned)

| Concern | Approach |
|---------|----------|
| Server data | TanStack Query (or RTK Query) — cache by route + cityId |
| Session token | SecureStore + in-memory auth context |
| Locale | AsyncStorage + i18n provider |
| Map camera | Local screen state |

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | API base URL (dev: `http://127.0.0.1:3010`) |
| `EXPO_PUBLIC_DEFAULT_CITY_ID` | Dev-only default tenant |

Never embed secrets in the mobile bundle. Session tokens come from API responses only.

## Related docs

- [Atomic design](atomic-design.md)
- [i18n](i18n.md)
- [API integration](api-integration.md)
