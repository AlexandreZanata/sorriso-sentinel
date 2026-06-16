package com.sorrisosentinel.mwmengine

import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** CoMaps-native engine: Framework, Storage, place-page events. */
class MwmEngineModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MwmEngineModule")

    Events("onPlacePageActivated", "onPlacePageDeactivated")

    OnCreate {
      CoMapsBridge.setPlacePageHandlers(
        onActivated = { bundle ->
          sendEvent("onPlacePageActivated", bundleToMap(bundle))
        },
        onDeactivated = {
          sendEvent("onPlacePageDeactivated", emptyMap())
        },
      )
    }

    View(MwmMapView::class) {
      Prop("pins") { view: MwmMapView, pins: List<Map<String, Any?>>? ->
        view.setPins(pins.orEmpty())
      }
    }

    Function("isNativeMapAvailable") {
      CoMapsBridge.isNativeMapAvailable()
    }

    AsyncFunction("initializeEngine") { _: Map<String, Any?> ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      CoMapsBridge.initialize(context)
    }

    AsyncFunction("getWritableMapsPath") {
      val context = appContext.reactContext ?: return@AsyncFunction ""
      CoMapsBridge.getWritableMapsPath(context)
    }

    AsyncFunction("listInstalledRegions") {
      // Native Storage reports installed maps after Framework reload.
      emptyList<Map<String, Any?>>()
    }

    AsyncFunction("downloadRegion") { regionId: String ->
      CoMapsBridge.startNativeDownload(regionId)
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

    AsyncFunction("reloadInstalledMaps") {
      CoMapsBridge.reloadInstalledMaps()
      true
    }
  }

  private fun bundleToMap(bundle: Bundle): Map<String, Any?> {
    val result = mutableMapOf<String, Any?>()

    for (key in bundle.keySet()) {
      result[key] = bundle.get(key)
    }

    return result
  }
}
