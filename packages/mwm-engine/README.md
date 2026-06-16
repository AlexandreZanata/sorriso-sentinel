# @sorriso-sentinel/mwm-engine

Native `.mwm` map engine bridge package for mobile.

## Scope

- **Download (TypeScript):** CoMaps/OM metaserver + CDN failover, `countries.txt` catalog, resumable `.mwm` download to app storage — mirrors `libs/storage/` and `libs/platform/downloader_utils.cpp` from CoMaps.
- **Render (React):** `MwmMapView` uses MapLibre GL JS in a `WebView` with OSM raster tiles and occurrence pin overlays. Offline `.mwm` files are stored for future native Drape integration.
- **Native scaffold:** Kotlin/Swift/C++ stubs remain for a future full CoMaps `drape_frontend` bridge.

## Platform

- Android: Kotlin Expo module in `android/` (view stub; map display is WebView)
- iOS: Swift Expo module in `ios/` (view stub; map display is WebView)

## Reference

Canonical offline map behavior: `/data/dev/projects/webstorm/comaps/`
