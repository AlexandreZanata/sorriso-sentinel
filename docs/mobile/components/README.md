# Mobile Component Catalog

Reusable UI inventory for `apps/mobile/src/ui/`. **Status: planned** — implement atoms first, then molecules that depend on them.

## Conventions

| Rule | Detail |
|------|--------|
| **English file names** | `occurrence-card.tsx`, not `card-ocorrencia.tsx` |
| **Accessibility** | Every interactive atom: `accessibilityRole`, `accessibilityLabel` from i18n |
| **No inline API calls** | Data fetching in feature hooks; pass props to organisms |
| **Tests** | Atoms/molecules: render + a11y snapshot; organisms: hook mocks |

## Index

| Layer | Catalog |
|-------|---------|
| Atoms | [atoms.md](atoms.md) |
| Molecules | [molecules.md](molecules.md) |
| Organisms | [organisms.md](organisms.md) |

## Implementation order

1. **Theme tokens** — colors, spacing, typography
2. **Atoms** — Text, Button, Icon, Spinner, Badge
3. **Templates** — ScreenShell, FormScreenLayout
4. **Molecules** — FormField, EmptyState, ErrorBanner, OccurrenceCard
5. **Organisms** — SessionBootstrapGate, OccurrenceList, MapViewport
6. **Feature screens** — wire organisms + `api/routes/*`

## Shared with web (future)

Map and admin UIs live in `apps/web`. Cross-app duplication is acceptable initially; extract to `packages/ui-native` / `packages/ui-web` only when three or more components stabilize.

## Related docs

- [Atomic design](../atomic-design.md)
- [i18n](../i18n.md)
