package com.sorrisosentinel.mwmengine

import android.os.Bundle
import app.organicmaps.sdk.bookmarks.data.MapObject
import app.organicmaps.sdk.bookmarks.data.Metadata

object PlacePageMapper {
  fun toBundle(mapObject: MapObject): Bundle {
    val featureId = mapObject.featureId
    val featureKey = if (featureId.isRealId) {
      "${featureId.mwmName}:${featureId.mwmVersion}:${featureId.featureIndex}"
    } else {
      null
    }

    return Bundle().apply {
      putString("featureId", featureKey)
      putString("title", mapObject.title)
      putString("subtitle", mapObject.subtitle)
      putString("secondaryTitle", mapObject.secondaryTitle)
      putString("address", mapObject.address)
      putDouble("latitude", mapObject.lat)
      putDouble("longitude", mapObject.lon)
      putString("phone", mapObject.getMetadata(Metadata.MetadataType.FMD_PHONE_NUMBER))
      putString(
        "website",
        mapObject.getWebsiteUrl(true, Metadata.MetadataType.FMD_WEBSITE),
      )
      putString("wikiDescription", mapObject.wikiArticle)
      putString("osmDescription", mapObject.osmDescription)
      putBoolean("isBookmark", mapObject.isBookmark)
      putBoolean("isMyPosition", mapObject.isMyPosition)
    }
  }
}
