# Molecules — Mobile Component Catalog

Path: `apps/mobile/src/ui/molecules/`

## FormField

Label + input + inline error. Used by auth and occurrence forms.

| Prop | Type | Notes |
|------|------|-------|
| `label` | `string` | i18n |
| `error` | `string \| undefined` | i18n error message |
| `children` | input element | TextInput from React Native |

## ListItem

Settings row: leading icon, title, optional chevron, `onPress`.

## OccurrenceCard

List cell for map drawer / occurrence feed.

| Prop | Type | Notes |
|------|------|-------|
| `category` | `string` | API field — display via i18n category map |
| `status` | `string` | Badge tone derived from status |
| `summary` | `string` | Truncated description |
| `distanceLabel` | `string \| undefined` | Formatted distance — never precise on sensitive |
| `onPress` | `() => void` | Navigate to detail |

## EmptyState

Icon + title + optional action button when lists are empty.

## ErrorBanner

Dismissible inline error with retry action. Maps `ApiError` code to i18n key in parent.

## AuthTextField

FormField preset for email (keyboard `email-address`) and password (`secureTextEntry`).

## VoteActions

Side-by-side confirm / deny buttons for community validation. Disabled when rate-limited or self-validation.

## MediaThumbnail

Square image preview with upload state badge (`pending`, `processing`, `ready`, `failed`).

## Status

| Component | Status |
|-----------|--------|
| FormField | planned |
| ListItem | planned |
| OccurrenceCard | planned |
| EmptyState | planned |
| ErrorBanner | planned |
| AuthTextField | planned |
| VoteActions | planned |
| MediaThumbnail | planned |
