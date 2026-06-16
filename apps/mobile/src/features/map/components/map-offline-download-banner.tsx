import { StyleSheet, View } from 'react-native';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { Text } from '../../../ui/atoms/text';
import { colors } from '../../../ui/theme/colors';
import { spacing } from '../../../ui/theme/spacing';
import { formatByteSize } from '../../../features/map/format-byte-size';
import type { MwmDownloadProgress } from '@sorriso-sentinel/mwm-engine';

export interface MapOfflineDownloadBannerProps {
  progress: MwmDownloadProgress;
  isInstalled: boolean;
}

export function MapOfflineDownloadBanner({
  progress,
  isInstalled,
}: MapOfflineDownloadBannerProps) {
  const { t } = useTranslation();

  if (isInstalled || progress.status === 'finished' || progress.status === 'failed') {
    return null;
  }

  if (progress.status !== 'downloading' && progress.status !== 'queued') {
    return null;
  }

  const totalBytes = progress.totalBytes || 0;
  const progressRatio =
    totalBytes > 0 ? Math.min(1, progress.downloadedBytes / totalBytes) : 0;
  const percent = Math.round(progressRatio * 100);

  return (
    <View style={styles.banner}>
      <Text variant="caption" color="textMuted">
        {t(I18N_KEYS.map.download.background, { percent })}
      </Text>
      {totalBytes > 0 ? (
        <Text variant="caption" color="textMuted">
          {formatByteSize(progress.downloadedBytes)} / {formatByteSize(totalBytes)}
        </Text>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
