import ExpoModulesCore
import UIKit

final class MwmMapView: ExpoView {
  private let background = UIView()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    background.backgroundColor = UIColor(red: 0.87, green: 0.93, blue: 1, alpha: 1)
    background.translatesAutoresizingMaskIntoConstraints = false
    addSubview(background)

    NSLayoutConstraint.activate([
      background.topAnchor.constraint(equalTo: topAnchor),
      background.bottomAnchor.constraint(equalTo: bottomAnchor),
      background.leadingAnchor.constraint(equalTo: leadingAnchor),
      background.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }

  func setPins(_ pins: [[String: Any]]) {
    accessibilityValue = "pins:\(pins.count)"
  }
}
