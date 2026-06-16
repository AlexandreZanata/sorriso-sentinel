package com.sorrisosentinel.mwmengine

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import app.organicmaps.sdk.Framework
import app.organicmaps.sdk.OrganicMaps
import app.organicmaps.sdk.PlacePageActivationListener
import app.organicmaps.sdk.bookmarks.data.MapObject
import app.organicmaps.sdk.downloader.MapManager
import app.organicmaps.sdk.settings.StoragePathManager
import app.organicmaps.sdk.widget.placepage.PlacePageData
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

typealias PlacePageEventHandler = (Bundle) -> Unit
typealias PlacePageDismissHandler = () -> Unit

object CoMapsBridge {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val initialized = AtomicBoolean(false)
  private val frameworkReady = AtomicBoolean(false)

  @Volatile
  private var organicMaps: OrganicMaps? = null

  @Volatile
  private var placePageHandler: PlacePageEventHandler? = null

  @Volatile
  private var placePageDismissHandler: PlacePageDismissHandler? = null

  private val placePageListener = object : PlacePageActivationListener {
    override fun onPlacePageActivated(data: PlacePageData) {
      if (data !is MapObject) {
        return
      }

      val bundle = PlacePageMapper.toBundle(data)
      mainHandler.post { placePageHandler?.invoke(bundle) }
    }

    override fun onPlacePageDeactivated() {
      mainHandler.post { placePageDismissHandler?.invoke() }
    }

    override fun onSwitchFullScreenMode() {
      // Not used in Sorriso Sentinel.
    }
  }

  fun setPlacePageHandlers(
    onActivated: PlacePageEventHandler?,
    onDeactivated: PlacePageDismissHandler?,
  ) {
    placePageHandler = onActivated
    placePageDismissHandler = onDeactivated
  }

  fun isNativeMapAvailable(): Boolean = true

  fun getWritableMapsPath(context: Context): String =
    StoragePathManager.findMapsStorage(context.applicationContext)

  @Synchronized
  fun initialize(context: Context): Boolean {
    if (initialized.get()) {
      return frameworkReady.get()
    }

    val appContext = context.applicationContext
    val applicationId = appContext.packageName
    val packageInfo = appContext.packageManager.getPackageInfo(applicationId, 0)

    organicMaps = OrganicMaps(
      appContext,
      "sorriso",
      applicationId,
      packageInfo.longVersionCode.toInt(),
      packageInfo.versionName ?: "0.1.0",
      "$applicationId.fileprovider",
      NativeLocationProviderFactory(),
    )

    val latch = CountDownLatch(1)

    try {
      val started = organicMaps?.init {
        frameworkReady.set(true)
        latch.countDown()
      } == true

      if (!started && organicMaps?.arePlatformAndCoreInitialized() == true) {
        frameworkReady.set(true)
      } else {
        latch.await(120, TimeUnit.SECONDS)
      }
    } catch (error: IOException) {
      organicMaps = null
      return false
    }

    frameworkReady.set(organicMaps?.arePlatformAndCoreInitialized() == true)
    initialized.set(true)

    if (frameworkReady.get()) {
      Framework.nativePlacePageActivationListener(placePageListener)
      Framework.nativeSetViewportCenter(-12.5423, -55.7214, 14)
    }

    return frameworkReady.get()
  }

  fun getOrganicMaps(): OrganicMaps? = organicMaps

  fun isFrameworkReady(): Boolean = frameworkReady.get()

  fun startNativeDownload(regionId: String) {
    MapManager.startDownload(regionId)
  }

  fun reloadInstalledMaps() {
    if (!frameworkReady.get()) {
      return
    }

    Framework.nativeReloadWorldMaps()
  }
}
