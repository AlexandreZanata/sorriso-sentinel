# @sorriso-sentinel/mwm-engine

Native `.mwm` map engine bridge package for mobile.

## Scope

- **Download (TypeScript):** CoMaps/OM metaserver + CDN failover, `countries.txt` catalog, resumable `.mwm` download with SHA-1 verification — mirrors `libs/storage/` from CoMaps. Files stored at `{documents}/{dataVersion}/{Region}.mwm` (same layout as CoMaps).
- **Render (interim):** `MwmMapView` uses MapLibre GL JS + OSM raster tiles in a `WebView`. **Does not read `.mwm`** — true CoMaps vector render requires native `drape_frontend` (see ADR-0005, `docs/mobile/comaps-integration.md`).
- **Place page (planned):** `MwmPlacePage` types mirror `place_page::Info`; native POI tap wiring is Phase 3.

## Platform

- Android: Kotlin Expo module in `android/` (view stub; map display is WebView)
- iOS: Swift Expo module in `ios/` (view stub; map display is WebView)

## Reference

Canonical offline map behavior: `/data/dev/projects/webstorm/comaps/`
