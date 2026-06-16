# CoMaps native map integration

Canonical reference: `/data/dev/projects/webstorm/comaps/`

## What is already aligned

| CoMaps | Sorriso Sentinel |
|--------|------------------|
| `METASERVER_URL`, `MAP_SERIES`, CDN failover | `packages/mwm-engine/src/downloader/` |
| `countries.txt` catalog + SHA-1 verify | `MapRegionDownloader` |
| `{documents}/{dataVersion}/{Region}.mwm` | ADR-0005 storage layout |
| Occurrence pins (app-specific) | API + `MapWebView` markers |

## What requires native CoMaps (not WebView)

| Feature | CoMaps component | Status |
|---------|------------------|--------|
| Vector map render | `drape_frontend` | Not integrated |
| POIs at zoom levels | `ScaleIndex` + `RuleDrawer` | Not integrated |
| Tap → place page | `place_page::Info` → `MapObject` | Types + UI shell only |
| Offline search | `search::Engine` + `sdx` index | Not integrated |
| Routing | `RoutingController` | Not integrated |
| Categories | `categories.txt` | Not integrated |

**MapLibre + OSM tiles cannot read `.mwm` files.** Until Phase 2 (see ADR-0005), the map shows online OSM tiles while `.mwm` downloads for future native render.

## Build CoMaps Android SDK (one-time)

```bash
# From CoMaps repo
cd /data/dev/projects/webstorm/comaps/android
./gradlew :sdk:assembleRelease

# Output AAR (path may vary by version):
# android/sdk/build/outputs/aar/sdk-release.aar
```

## Link into Sorriso (Phase 2)

1. Copy or composite-build `comaps/android/sdk` as a dependency of `packages/mwm-engine/android`.
2. Initialize in `MainApplication`:
   - `OrganicMaps.init()` (mirror `MwmApplication.java`)
3. Replace `MwmMapView.kt` stub with `app.organicmaps.sdk.MapView`.
4. Register `.mwm` from `{documents}/{dataVersion}/` via native `Storage`.
5. Forward `Framework.nativePlacePageActivationListener` to Expo `onPlacePageActivated` event.

## Run the app (current interim stack)

```bash
make docker-up
docker compose -f docker/docker-compose.api.yml up

cd apps/mobile/android
EXPO_PUBLIC_API_URL=http://<LAN_IP>:3010 ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Related

- [ADR-0005](../adr/0005-comaps-native-map-rendering.md)
- `packages/mwm-engine/README.md`
