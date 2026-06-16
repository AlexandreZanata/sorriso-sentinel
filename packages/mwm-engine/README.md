# @sorriso-sentinel/mwm-engine

Native `.mwm` map engine bridge package for mobile.

## Scope

- Exposes `initializeEngine`, `listInstalledRegions`, `downloadRegion`, `getDownloadProgress`
- Exposes `MwmMapView` native view for map rendering
- Holds a vendored C++ core scaffold under `cpp/`

## Platform

- Android: Kotlin Expo module in `android/`
- iOS: Swift Expo module in `ios/`
