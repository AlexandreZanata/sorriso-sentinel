#include "mwm_engine_core.hpp"

namespace sorriso::mwm {

bool MwmEngineCore::Initialize(std::string const &, std::string const &,
                               std::string const &, std::int32_t,
                               std::string const &) {
  return true;
}

std::vector<RegionDescriptor> MwmEngineCore::ListInstalledRegions() const {
  return {};
}

bool MwmEngineCore::DownloadRegion(std::string const &) {
  return true;
}

DownloadProgress MwmEngineCore::GetDownloadProgress(std::string const & region_id) const {
  return DownloadProgress{
    .region_id = region_id,
    .downloaded_bytes = 0,
    .total_bytes = 0,
    .status = "queued",
  };
}

}  // namespace sorriso::mwm
