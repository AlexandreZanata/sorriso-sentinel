# @sorriso-sentinel/mobile

React Native + Expo SDK 54 client for Sorriso Sentinel.

## Status

Scaffold only — placeholder `App.tsx`. Full structure, i18n, UI catalog, and API integration are documented before implementation.

## Documentation

All mobile docs live under [`docs/mobile/`](../../docs/mobile/README.md):

| Topic | Doc |
|-------|-----|
| Architecture | [architecture.md](../../docs/mobile/architecture.md) |
| i18n | [i18n.md](../../docs/mobile/i18n.md) |
| Atomic design | [atomic-design.md](../../docs/mobile/atomic-design.md) |
| Components | [components/](../../docs/mobile/components/README.md) |
| API integration | [api-integration.md](../../docs/mobile/api-integration.md) |
| API routes | [api-routes.md](../../docs/mobile/api-routes.md) |
| Navigation | [navigation.md](../../docs/mobile/navigation.md) |

## Commands

```bash
npm run dev        # expo start
npm run typecheck
npm run test
```

## Related packages

- `@sorriso-sentinel/shared` — validation schemas, API types
- `@sorriso-sentinel/domain` — types only in mobile (no runtime domain imports with side effects)
