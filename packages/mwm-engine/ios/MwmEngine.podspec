require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'MwmEngine'
  s.version      = package['version']
  s.summary      = 'Native .mwm engine bridge for Sorriso Sentinel.'
  s.description  = 'Expo native module and view for CoMaps-style .mwm integration.'
  s.license      = package['license']
  s.author       = 'Sorriso Sentinel'
  s.homepage     = 'https://github.com/AlexandreZanata/sorriso-sentinel'
  s.platforms    = { :ios => '15.1' }
  s.source       = { :git => 'https://example.invalid/sorriso-sentinel.git' }
  s.static_framework = true

  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  s.dependency 'ExpoModulesCore'
end
