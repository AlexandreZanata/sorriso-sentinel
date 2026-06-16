# ADR 0005: CoMaps native map rendering

## Status

Accepted

## Context

Sorriso Sentinel must display offline vector maps with the same data, styling, POIs, routing, and place-page behavior as [CoMaps](https://github.com/comapsapp/comaps) (Organic Maps fork). The reference implementation lives at `/data/dev/projects/webstorm/comaps/`.

Today:

- **Download** mirrors CoMaps CDN (`libs/storage/`, `downloader_utils.cpp`) in TypeScript (`@sorriso-sentinel/mwm-engine`).
- **Render** uses MapLibre GL JS + OSM raster tiles inside a React Native `WebView`. Downloaded `.mwm` files are not read for display.
- **Place data** on tap is not available for MWM features; only API occurrence pins are shown.

CoMaps rendering pipeline:

```
.mwm → DataSource / ScaleIndex → Drape (drape_frontend) → GPU
Tap → Framework::BuildPlacePageInfo → place_page::Info → MapObject (Android)
```

This cannot be reproduced in JavaScript without vendoring the full C++ stack.

## Decision

Adopt a **phased native integration** of the CoMaps Android/iOS SDK (`app.organicmaps.sdk.MapView`, `Framework`, `OrganicMaps.init()`), while keeping the TypeScript downloader until native `Storage` registration is wired.

### Phase 1 (current)

- Align on-disk `.mwm` layout with CoMaps: `{documents}/{dataVersion}/{RegionId}.mwm`.
- Define `MwmPlacePage` TypeScript contract mirroring `MapObject` / `place_page::Info`.
- Add RN place-page bottom sheet; wire occurrence pins now; native POI events later.
- Document build steps to produce and link the CoMaps SDK AAR.

### Phase 2

- Vendor CoMaps `android/sdk` (CMake target `organicmaps`) into `packages/mwm-engine/android`.
- Initialize `OrganicMaps` in `MainApplication`; replace `MwmMapView` stub with `app.organicmaps.sdk.MapView`.
- Register downloaded `.mwm` files via native `Storage` / `Framework`.

### Phase 3

- `Framework.nativePlacePageActivationListener` → Expo events → `MwmPlacePageSheet`.
- Occurrence pins as Drape user marks or RN overlay above GL surface.
- Routing via `RoutingController` when product requires it.

### Phase 4

- iOS parity (`MapView` Swift bridge).
- Remove WebView/OSM fallback when native path is stable.

## Consequences

- APK size and build time increase significantly (full NDK CoMaps build).
- Apache 2.0 license is compatible; NOTICE must list CoMaps attribution.
- WebView map remains the **interim** online fallback until Phase 2 ships.
- Storage path change requires migration from legacy `mwm/{cityId}/` layout.

## References

- CoMaps: `libs/drape_frontend/`, `libs/map/place_page_info.hpp`, `android/sdk/`
- Sorriso: `packages/mwm-engine/`, `docs/mobile/comaps-integration.md`
