#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace sorriso::mwm {

struct RegionDescriptor {
  std::string id;
  std::string name;
  std::int64_t size_bytes;
  std::int32_t version;
};

struct DownloadProgress {
  std::string region_id;
  std::int64_t downloaded_bytes;
  std::int64_t total_bytes;
  std::string status;
};

class MwmEngineCore {
 public:
  bool Initialize(std::string const & writable_path, std::string const & cache_path,
                  std::string const & locale, std::int32_t data_version,
                  std::string const & metadata_url);
  std::vector<RegionDescriptor> ListInstalledRegions() const;
  bool DownloadRegion(std::string const & region_id);
  DownloadProgress GetDownloadProgress(std::string const & region_id) const;
};

}  // namespace sorriso::mwm
