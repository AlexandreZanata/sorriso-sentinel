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

## Agent reference — CoMaps (`.mwm` engine)

When implementing or debugging **offline vector maps** (download `.mwm` packages, storage, native rendering), always use the local CoMaps/Organic Maps codebase as the canonical reference:

```text
/data/dev/projects/webstorm/comaps/
```

Key areas to mirror (not copy blindly):

| CoMaps path | Purpose |
|-------------|---------|
| `libs/storage/map_files_downloader.cpp` | Metaserver + file server selection |
| `libs/storage/http_map_files_downloader.cpp` | Region download queue |
| `libs/platform/http_request.cpp` | Chunked/resumable download to disk |
| `libs/storage/storage.cpp` | Verify, register, persist installed `.mwm` |
| `libs/drape_frontend/` | Viewport rendering (Drape engine) |
| `data/countries.txt` | Region hierarchy and package metadata |

Our integration lives in `@sorriso-sentinel/mwm-engine` (`packages/mwm-engine/`) and `MapViewport` (`src/ui/organisms/map-viewport/`).

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
pnpm run dev        # expo start
pnpm run dev:client # expo start --dev-client
pnpm run prebuild   # generate ios/android native projects
pnpm run android    # build/run Android dev client
pnpm run ios        # build/run iOS dev client
pnpm run test       # vitest (i18n, api, bootstrap errors)
pnpm run typecheck
```

## Environment

Copy root `.env.example` — mobile uses:

- `EXPO_PUBLIC_API_URL` (default `http://127.0.0.1:3010`)
- `EXPO_PUBLIC_DEFAULT_CITY_ID`

On a physical device on the same Wi‑Fi, point `EXPO_PUBLIC_API_URL` at your machine LAN IP (API listens on `0.0.0.0:3010`):

```bash
# You are already in apps/mobile if you followed the setup flow
hostname -I | awk '{print $1}'   # e.g. 172.19.2.162

export ANDROID_HOME=/data/dev/android/sdk/Sdk
export PATH="$ANDROID_HOME/platform-tools:$PATH"

pnpm run android:configure   # writes android/local.properties (sdk + ndk)
pnpm run android             # build dev client once

EXPO_PUBLIC_API_URL=http://172.19.2.162:3010 \
EXPO_PUBLIC_DEFAULT_CITY_ID=01932f1a-0000-7000-8000-000000000001 \
pnpm run dev:client
```

On USB, `adb reverse` still works with `127.0.0.1`:

```bash
export ANDROID_HOME=/data/dev/android/sdk/Sdk
export PATH="$ANDROID_HOME/platform-tools:$PATH"

adb reverse tcp:3010 tcp:3010   # API
adb reverse tcp:8082 tcp:8082   # Metro (if not using default 8081)

cd apps/mobile
EXPO_PUBLIC_API_URL=http://127.0.0.1:3010 \
EXPO_PUBLIC_DEFAULT_CITY_ID=01932f1a-0000-7000-8000-000000000001 \
pnpm exec expo start --dev-client --android --port 8082
```

Requires a **dev client** build (`pnpm run android` once after `pnpm run prebuild`) — Expo Go cannot load `@sorriso-sentinel/mwm-engine`.

Without USB reverse, use your machine LAN IP instead of `127.0.0.1`.

## Related packages

- `@sorriso-sentinel/shared` — Zod schemas (`bootstrapSessionSchema`)
- `@sorriso-sentinel/domain` — domain types only (no runtime imports with side effects)
