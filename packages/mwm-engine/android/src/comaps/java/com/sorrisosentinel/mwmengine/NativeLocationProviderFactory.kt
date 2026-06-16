package com.sorrisosentinel.mwmengine

import android.content.Context
import app.organicmaps.sdk.location.AndroidNativeProvider
import app.organicmaps.sdk.location.BaseLocationProvider
import app.organicmaps.sdk.location.LocationProviderFactory

/** Uses the Android framework location provider (no Google Play Services required). */
class NativeLocationProviderFactory : LocationProviderFactory {
  override fun isGoogleLocationAvailable(context: Context): Boolean = false

  override fun getProvider(
    context: Context,
    listener: BaseLocationProvider.Listener,
  ): BaseLocationProvider = AndroidNativeProvider(context, listener)
}
