# CoMaps native map integration

Canonical reference: `/data/dev/projects/webstorm/comaps/`

## What is already aligned

| CoMaps | Sorriso Sentinel |
|--------|------------------|
| `METASERVER_URL`, `MAP_SERIES`, CDN failover | `packages/mwm-engine/src/downloader/` |
| `countries.txt` catalog + SHA-1 verify | `MapRegionDownloader` |
| `{documents}/{dataVersion}/{Region}.mwm` | ADR-0005 storage layout |
| Occurrence pins (app-specific) | API + map markers |
| Place page on POI tap | Native bridge + `MwmPlacePageSheet` (when SDK linked) |

## Native vs interim stack

| Mode | Map render | POI tap | Download |
|------|------------|---------|----------|
| `comapsSdkEnabled=false` (default) | MapLibre WebView + OSM tiles | Not available | TypeScript CDN pipeline |
| `comapsSdkEnabled=true` | CoMaps `MapView` (drape_frontend) | `place_page::Info` → RN sheet | CoMaps `MapManager` + shared `.mwm` path |

**MapLibre cannot read `.mwm` files.** Enable the native SDK for the same vector map, POIs, and place pages as the CoMaps app.

## Build CoMaps Android SDK (one-time)

```bash
# 1. Clone and init submodules
git clone https://github.com/comapsapp/comaps.git /data/dev/projects/webstorm/comaps
cd /data/dev/projects/webstorm/comaps
git submodule update --init --recursive

# 2. Build SDK (from Sorriso repo)
COMAPS_ROOT=/data/dev/projects/webstorm/comaps ./scripts/build-comaps-android-sdk.sh
```

## Enable native map in the mobile app

1. Build CoMaps SDK (see above).
2. Set `comapsSdkEnabled=true` in `apps/mobile/android/gradle.properties`.
3. Ensure NDK **28.2.13676358** is installed (`sdkmanager "ndk;28.2.13676358"`).
4. Do **not** set `ndk.dir` in `local.properties` (causes CXX1104 vs RN modules).
5. Rebuild:

```bash
cd apps/mobile/android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**Note:** CoMaps `assembleRelease` fails with `ld.gold` on NDK r28; use `assembleDebug` for the SDK (see `scripts/build-comaps-android-sdk.sh`).

## Run with local API

```bash
make docker-up
docker compose -f docker/docker-compose.api.yml up

# Physical device — use your machine LAN IP
EXPO_PUBLIC_API_URL=http://<LAN_IP>:3010 pnpm --filter @sorriso-sentinel/mobile run android

# USB debugging
adb reverse tcp:3010 tcp:3010
```

The app loads `SessionGate` → `MainTabs` → `MapScreen` directly (no splash mock). API binds `HOST=0.0.0.0` on port `3010`.

## Architecture

```
Tap on POI (native)
  → Framework::BuildPlacePageInfo
  → PlacePageActivationListener (Kotlin)
  → Expo event onPlacePageActivated
  → MwmPlacePageSheet (React Native)
```

## Related

- [ADR-0005](../adr/0005-comaps-native-map-rendering.md)
- `packages/mwm-engine/README.md`
