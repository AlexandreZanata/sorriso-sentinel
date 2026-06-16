package com.sorrisosentinel.mwmengine

import android.content.Context
import android.graphics.Color
import android.view.View

class MwmMapView(context: Context) : View(context) {
  init {
    setBackgroundColor(Color.parseColor("#DDEBFF"))
  }

  fun setPins(@Suppress("UNUSED_PARAMETER") pins: List<Map<String, Any?>>) {
    invalidate()
  }
}
