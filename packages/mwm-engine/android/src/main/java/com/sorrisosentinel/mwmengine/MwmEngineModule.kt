package com.sorrisosentinel.mwmengine

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MwmEngineModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MwmEngineModule")

    View(MwmMapView::class) {
      Prop("pins") { view: MwmMapView, pins: List<Map<String, Any?>>? ->
        view.setPins(pins.orEmpty())
      }
    }

    AsyncFunction("initializeEngine") { _: Map<String, Any?> ->
      true
    }

    AsyncFunction("listInstalledRegions") {
      emptyList<Map<String, Any?>>()
    }

    AsyncFunction("downloadRegion") { _: String ->
      true
    }

    AsyncFunction("getDownloadProgress") { regionId: String ->
      mapOf(
        "regionId" to regionId,
        "downloadedBytes" to 0,
        "totalBytes" to 0,
        "status" to "queued",
      )
    }
  }
}
