package com.sorrisosentinel.mwmengine

import android.content.Context
import android.widget.FrameLayout
import androidx.lifecycle.findViewTreeLifecycleOwner
import app.organicmaps.sdk.MapController
import app.organicmaps.sdk.MapRenderingListener
import app.organicmaps.sdk.MapView

/** CoMaps vector map surface (drape_frontend). */
class MwmMapView(context: Context) : FrameLayout(context), MapRenderingListener {
  private val mapView = MapView(context)
  private var mapController: MapController? = null

  init {
    addView(
      mapView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
    )
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    if (mapController != null) {
      return
    }

    CoMapsBridge.initialize(context)

    val organicMaps = CoMapsBridge.getOrganicMaps() ?: return
    val locationHelper = organicMaps.locationHelper

    mapController = MapController(
      mapView,
      locationHelper,
      this,
      null,
      false,
    )

    findViewTreeLifecycleOwner()?.lifecycle?.addObserver(mapController!!)
  }

  override fun onDetachedFromWindow() {
    mapController?.let { controller ->
      findViewTreeLifecycleOwner()?.lifecycle?.removeObserver(controller)
    }
    mapController = null
    super.onDetachedFromWindow()
  }

  fun setPins(@Suppress("UNUSED_PARAMETER") pins: List<Map<String, Any?>>) {
    // Occurrence pins are rendered as API overlays in Phase 3.
  }

  override fun onRenderingCreated() {
    // No-op — Sorriso Sentinel does not show CoMaps built-in widgets.
  }
}
