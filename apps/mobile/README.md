# @sorriso-sentinel/mobile

React Native + Expo SDK 54 client for Sorriso Sentinel.

## Status

Foundation implemented:

- i18n (`en`, `pt-BR`) with AsyncStorage preference
- Theme tokens and atoms (`Text`, `Button`, `Spinner`, `Badge`)
- API client, error mapping, session bootstrap (`POST /sessions/bootstrap`)
- React Navigation: bootstrap gate → main tabs (Map, Report, Settings)

## Documentation

All mobile docs live under [`docs/mobile/`](../../docs/mobile/README.md).

## Structure

```text
apps/mobile/src/
├── api/           # HTTP client, SecureStore, route adapters
├── features/      # Vertical slices (bootstrap, map, occurrences, settings)
├── i18n/          # Locales, translate, provider
├── navigation/    # Root stack + main tabs
├── session/       # Session context
├── ui/            # atoms, organisms, templates, theme
└── providers/     # AppProviders
```

## Commands

```bash
npm run dev        # expo start
npm run test       # vitest (i18n, api, bootstrap errors)
npm run typecheck
```

## Environment

Copy root `.env.example` — mobile uses:

- `EXPO_PUBLIC_API_URL` (default `http://127.0.0.1:3010`)
- `EXPO_PUBLIC_DEFAULT_CITY_ID`

On a physical device, use your machine LAN IP instead of `127.0.0.1`.

## Related packages

- `@sorriso-sentinel/shared` — Zod schemas (`bootstrapSessionSchema`)
- `@sorriso-sentinel/domain` — domain types only (no runtime imports with side effects)
