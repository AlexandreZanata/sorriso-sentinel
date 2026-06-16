#!/usr/bin/env bash
# Builds the CoMaps Android SDK AAR for linking into @sorriso-sentinel/mwm-engine (Phase 2).
set -euo pipefail

COMAPS_ROOT="${COMAPS_ROOT:-/data/dev/projects/webstorm/comaps}"

if [[ ! -d "$COMAPS_ROOT/android" ]]; then
  echo "CoMaps not found at $COMAPS_ROOT" >&2
  exit 1
fi

cd "$COMAPS_ROOT/android"
./gradlew :sdk:assembleRelease

echo ""
echo "CoMaps SDK build complete. Locate AAR under:"
echo "  $COMAPS_ROOT/android/sdk/build/outputs/aar/"
echo ""
echo "Next: link AAR in packages/mwm-engine/android — see docs/mobile/comaps-integration.md"
