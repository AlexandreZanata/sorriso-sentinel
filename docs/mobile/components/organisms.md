# Organisms — Mobile Component Catalog

Path: `apps/mobile/src/ui/organisms/`

Organisms may consume feature hooks passed as props or via render props — avoid importing `features/*` directly when the organism is shared across features.

## OccurrenceList

| Concern | Detail |
|---------|--------|
| Data | `occurrences: OccurrenceListItem[]`, `onRefresh`, `isRefreshing` |
| UI | FlatList of OccurrenceCard, EmptyState, ErrorBanner |
| Pagination | Cursor / offset from `GET /occurrences` query params |

## OccurrenceDetailHeader

Category badge, status, problem location label (shifted coordinates per privacy), author display policy respected.

## CommentThread

Read `GET /occurrences/:id/comments`; compose via `POST /occurrences/:id/comments`. Hide author on sensitive categories.

## MapViewport

Native `.mwm` engine view (`@sorriso-sentinel/mwm-engine`) with occurrence pin layer and region download control. User location remains limited to problem pins only — never contributor GPS.

| Concern | Detail |
|---------|--------|
| Tiles | Document `connect-src` / CSP exceptions in deployment when web shares config |
| Clustering | Planned for dense areas |

## SessionBootstrapGate

On app launch: call `POST /sessions/bootstrap` with `cityId` + device `localKeyRef`. Shows Spinner or ErrorBanner with retry.

## LoginForm

Email + password → `POST /auth/login`. Stores access + refresh tokens in SecureStore.

## ProfileHeader

Avatar, display name or pseudonym per `identityMode`, reputation badge (public-safe fields only).

## UploadProgressPanel

Orchestrates presigned slot flow:

1. `POST /occurrences/:id/media/upload-slots`
2. PUT to presigned URL (direct to MinIO/S3)
3. `POST /media/upload-slots/:slotId/complete`
4. Poll `GET /occurrences/:id/media`

## Status

| Component | Status |
|-----------|--------|
| OccurrenceList | planned |
| OccurrenceDetailHeader | planned |
| CommentThread | planned |
| MapViewport | in progress |
| SessionBootstrapGate | planned |
| LoginForm | planned |
| ProfileHeader | planned |
| UploadProgressPanel | planned |
