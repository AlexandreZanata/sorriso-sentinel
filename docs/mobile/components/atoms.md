# Atoms — Mobile Component Catalog

Path: `apps/mobile/src/ui/atoms/`

## Text

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `'title' \| 'subtitle' \| 'body' \| 'caption'` | `'body'` | Maps to theme typography |
| `color` | semantic color key | `'textPrimary'` | |
| `children` | `ReactNode` | — | Use i18n string from parent |

## Button

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | |
| `label` | `string` | — | i18n resolved text |
| `onPress` | `() => void` | — | |
| `loading` | `boolean` | `false` | Shows Spinner, disables press |
| `disabled` | `boolean` | `false` | |

## Icon

| Prop | Type | Notes |
|------|------|-------|
| `name` | union of icon names | Centralized in `icons.ts` |
| `size` | `number` | Default 24 |
| `color` | semantic color key | |

## Spinner

Loading indicator — used inside Button and full-screen gates.

## Badge

| Prop | Type | Notes |
|------|------|-------|
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'danger'` | Maps to occurrence status colors |
| `label` | `string` | Short status text |

## Divider

Horizontal separator — `marginVertical` from spacing token.

## PressableSurface

Wraps children with opacity/ripple feedback. Required for custom touch targets not using Button.

## Avatar

| Prop | Type | Notes |
|------|------|-------|
| `uri` | `string \| undefined` | Profile photo URL |
| `fallbackInitial` | `string \| undefined` | Pseudonym initial — never real name on sensitive flows |

## Status

| Component | Status |
|-----------|--------|
| Text | planned |
| Button | planned |
| Icon | planned |
| Spinner | planned |
| Badge | planned |
| Divider | planned |
| PressableSurface | planned |
| Avatar | planned |
