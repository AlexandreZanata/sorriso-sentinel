# Mobile Atomic Design

UI composition follows **atomic design**, aligned with the API docs renderer (`apps/api/src/features/docs/ui/`).

## Hierarchy

```text
atoms       → smallest primitives (no business logic)
molecules   → composed atoms (single concern)
organisms   → feature-ready sections (may use hooks)
templates   → page layout shells (no domain data)
screens       → in features/*/screens (wire organisms + data)
```

## Dependency rules

| Layer | May import | Must not import |
|-------|------------|-----------------|
| Atoms | `theme/`, other atoms | molecules, organisms, features, api |
| Molecules | atoms, `theme/`, i18n | organisms, features, api |
| Organisms | atoms, molecules, i18n, feature hooks | other features' screens |
| Templates | atoms, molecules | feature hooks, api |
| Screens | all ui layers, api hooks, navigation | other features' internal modules |

## Atoms (`src/ui/atoms/`)

| Component | Purpose | Props (summary) |
|-----------|---------|-----------------|
| `Text` | Typography variants | `variant`, `color`, `children` |
| `Button` | Primary / secondary / ghost | `label`, `onPress`, `loading`, `disabled` |
| `Icon` | Lucide or Expo vector icons | `name`, `size`, `color` |
| `Spinner` | Loading indicator | `size` |
| `Badge` | Status pill (unverified, confirmed) | `tone`, `label` |
| `Divider` | Horizontal rule | — |
| `PressableSurface` | Touch feedback wrapper | `onPress`, `accessibilityLabel` |
| `Avatar` | Profile / ghost placeholder | `uri?`, `fallbackInitial?` |

## Molecules (`src/ui/molecules/`)

| Component | Composes | Purpose |
|-----------|----------|---------|
| `FormField` | Text, label, error Text | Single input with validation message |
| `ListItem` | Text, Icon, PressableSurface | Settings / menu rows |
| `OccurrenceCard` | Badge, Text, Icon | List preview (category, status, distance) |
| `EmptyState` | Icon, Text, Button | No data placeholder |
| `ErrorBanner` | Icon, Text, Button | Inline recoverable error |
| `AuthTextField` | FormField | Email / password with secure entry |
| `VoteActions` | Button × 2 | Confirm / deny validation buttons |
| `MediaThumbnail` | Image, Badge | Upload slot preview |

## Organisms (`src/ui/organisms/`)

| Component | Purpose | Used by features |
|-----------|---------|------------------|
| `OccurrenceList` | FlatList + pull-to-refresh | map, occurrences |
| `OccurrenceDetailHeader` | Category, status, location summary | occurrences |
| `CommentThread` | List + compose field | occurrences |
| `MapViewport` | MapLibre + pin layer | map |
| `SessionBootstrapGate` | Loading / error for ghost session | bootstrap |
| `LoginForm` | AuthTextField × 2 + Button | account |
| `ProfileHeader` | Avatar + display name policy | account, identity |
| `UploadProgressPanel` | Media thumbnails + slot status | media |

## Templates (`src/ui/templates/`)

| Template | Layout |
|----------|--------|
| `ScreenShell` | SafeArea + header slot + scroll body |
| `TabLayout` | Bottom tabs container |
| `ModalLayout` | Centered sheet / full-screen modal |
| `FormScreenLayout` | Keyboard-aware scroll + sticky footer CTA |

## Theme tokens (`src/ui/theme/`)

| Token file | Contents |
|------------|----------|
| `colors.ts` | Semantic: `primary`, `danger`, `surface`, `textMuted` |
| `spacing.ts` | `xs` … `xl` on 4px grid |
| `typography.ts` | `title`, `body`, `caption` — fontSize + lineHeight |
| `radii.ts` | `sm`, `md`, `full` |

Use tokens in StyleSheet — avoid hard-coded hex in feature screens.

## File naming

```text
src/ui/atoms/button/button.tsx
src/ui/atoms/button/button.spec.tsx
src/ui/atoms/button/index.ts
```

One component per folder; barrel `index.ts` for public exports.

## Storybook (future)

Optional `@storybook/react-native` for atoms and molecules in isolation — not required for MVP.

## Related docs

- [Component catalog](components/README.md)
- [Architecture](architecture.md)
