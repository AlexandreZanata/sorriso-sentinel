#!/usr/bin/env bash
# Builds the CoMaps Android SDK AAR for linking into @sorriso-sentinel/mwm-engine (Phase 2).
set -euo pipefail

COMAPS_ROOT="${COMAPS_ROOT:-/data/dev/projects/webstorm/comaps}"

if [[ ! -d "$COMAPS_ROOT/android" ]]; then
  echo "CoMaps not found at $COMAPS_ROOT" >&2
  echo "Clone https://github.com/comapsapp/comaps and set COMAPS_ROOT." >&2
  exit 1
fi

if [[ ! -f "$COMAPS_ROOT/3party/expat/expat/CMakeLists.txt" ]]; then
  echo "CoMaps third-party submodules are missing." >&2
  echo "Run in the CoMaps repo:" >&2
  echo "  cd $COMAPS_ROOT && git submodule update --init --recursive" >&2
  exit 1
fi

if [[ ! -f "$COMAPS_ROOT/libs/platform/localized_types_map.cpp" ]]; then
  echo "Running CoMaps configure.sh (generates localized_types_map.cpp, drules)..."
  PATH="/data/dev/android/sdk/Sdk/cmake/3.22.1/bin:$PATH" \
    SKIP_MAP_DOWNLOAD=1 bash "$COMAPS_ROOT/configure.sh" --skip-generate-symbols
fi

cd "$COMAPS_ROOT/android"
PATH="${NDK:-/data/dev/android/sdk/Sdk/ndk/28.2.13676358}/toolchains/llvm/prebuilt/linux-x86_64/bin:/data/dev/android/sdk/Sdk/cmake/3.22.1/bin:$PATH"

# Debug avoids LTO + ld.gold (broken on NDK r28 without LLVMgold.so).
# For release, add -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=OFF or -fuse-ld=lld in CoMaps CMake.
./gradlew :sdk:assembleDebug -Parm64

echo ""
echo "CoMaps SDK build complete."
echo ""
echo "Enable native map in Sorriso Sentinel:"
echo "  1. apps/mobile/android/gradle.properties → comapsSdkEnabled=true"
echo "  2. cd apps/mobile/android && ./gradlew assembleDebug"
echo ""
echo "See docs/mobile/comaps-integration.md"
