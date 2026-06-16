import ExpoModulesCore

public class MwmEngineModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MwmEngineModule")

    View(MwmMapView.self) {
      Prop("pins") { (view: MwmMapView, pins: [[String: Any]]?) in
        view.setPins(pins ?? [])
      }
    }

    AsyncFunction("initializeEngine") { (_: [String: Any]) in
      true
    }

    AsyncFunction("listInstalledRegions") {
      [[String: Any]]()
    }

    AsyncFunction("downloadRegion") { (_: String) in
      true
    }

    AsyncFunction("getDownloadProgress") { (regionId: String) in
      [
        "regionId": regionId,
        "downloadedBytes": 0,
        "totalBytes": 0,
        "status": "queued",
      ] as [String : Any]
    }
  }
}
