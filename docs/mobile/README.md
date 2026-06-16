# Mobile App — Documentation

React Native + Expo SDK 54 client (`apps/mobile`). These docs define **structure, i18n, UI composition, and API integration** before feature implementation.

**Status:** in implementation — foundation (i18n, theme, bootstrap, tabs) landed; native `.mwm` map engine and occurrence map pins in progress.

## Agent reference — CoMaps

For map engine work (`.mwm` download, storage, native render), agents must treat this local tree as the reference implementation:

`/data/dev/projects/webstorm/comaps/`

See also [`apps/mobile/README.md`](../../apps/mobile/README.md#agent-reference--comaps-mwm-engine).

## Document set

| File | Purpose |
|------|---------|
| [architecture.md](architecture.md) | Folder layout, vertical slices, dependency rules |
| [i18n.md](i18n.md) | Locales, keys, copy policy, runtime switching |
| [atomic-design.md](atomic-design.md) | Atoms → molecules → organisms → templates |
| [components/README.md](components/README.md) | Reusable component catalog (planned) |
| [api-integration.md](api-integration.md) | HTTP client, auth headers, error handling |
| [api-routes.md](api-routes.md) | Route matrix mapped to mobile features and screens |
| [navigation.md](navigation.md) | Screen map and deep links (planned) |

## Principles

| Principle | Mobile implementation |
|-----------|------------------------|
| **English-only artifacts** | Code, keys, comments, tests — English |
| **User-facing copy** | Localized via i18n; default locale `en`, `pt-BR` supported |
| **Domain logic in packages** | `packages/domain` + `packages/shared` — not in UI components |
| **Vertical slices** | `src/features/<feature>/` — screens + hooks + feature-specific molecules |
| **Atomic UI** | Shared primitives in `src/ui/atoms`, `molecules`, `organisms` |
| **API source of truth** | `packages/shared/src/api-docs/` — sync with `/docs/spec.json` |

## Package

```text
apps/mobile/
├── App.tsx                 # Entry (will delegate to navigation root)
├── src/
│   ├── ui/                 # Design system (atomic)
│   ├── i18n/               # Locales and translator
│   ├── navigation/         # Expo Router or React Navigation
│   ├── api/                # HTTP client + route adapters
│   └── features/           # Vertical slices per bounded context
└── package.json
```

Run locally:

```bash
cd apps/mobile && pnpm run dev
```

## Related docs

- [Technology stack](../architecture/stack.md)
- [Monorepo structure](../architecture/monorepo-structure.md)
- [API documentation](../api/README.md)
- [Privacy and identity](../system/privacy-and-identity.md)
- [Feature modules](../features/README.md)
