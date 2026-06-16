import { Platform, StyleSheet, View } from 'react-native';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { Badge } from '../../atoms/badge';
import { Button } from '../../atoms/button';
import { Text } from '../../atoms/text';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { formatByteSize } from '../../../features/map/format-byte-size';
import { formatRegionDisplayName } from '../../../features/map/format-region-display-name';
import type { MwmDownloadProgress, MwmRegionCatalogEntry } from '@sorriso-sentinel/mwm-engine';

export interface MapDownloadGateCardProps {
  regionId: string;
  catalogEntry: MwmRegionCatalogEntry | null;
  progress: MwmDownloadProgress;
  isDownloading: boolean;
  onDownload: () => void;
}

function MapGlyph() {
  return (
    <View style={styles.glyphOuter}>
      <View style={styles.glyphFold} />
      <View style={styles.glyphPin} />
    </View>
  );
}

export function MapDownloadGateCard({
  regionId,
  catalogEntry,
  progress,
  isDownloading,
  onDownload,
}: MapDownloadGateCardProps) {
  const { t } = useTranslation();

  const totalBytes = progress.totalBytes || catalogEntry?.sizeBytes || 0;
  const progressRatio =
    totalBytes > 0 ? Math.min(1, progress.downloadedBytes / totalBytes) : 0;
  const isFailed = progress.status === 'failed' && !isDownloading;
  const isActive = isDownloading || progress.status === 'downloading';
  const regionLabel = formatRegionDisplayName(regionId);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <MapGlyph />
        </View>
        <Badge label={t(I18N_KEYS.map.download.offlineBadge)} tone="neutral" />
        <Text variant="title" style={styles.title}>
          {t(I18N_KEYS.map.download.title)}
        </Text>
        <Text variant="body" color="textMuted" style={styles.explanation}>
          {t(I18N_KEYS.map.download.explanation)}
        </Text>
      </View>

      <View style={styles.regionCard}>
        <View style={styles.regionAccent} />
        <View style={styles.regionContent}>
          <Text variant="subtitle">{regionLabel}</Text>
          <Text variant="caption" color="textMuted">
            {catalogEntry
              ? t(I18N_KEYS.map.download.sizeLabel, {
                  size: formatByteSize(catalogEntry.sizeBytes),
                })
              : t(I18N_KEYS.map.download.sizePending)}
          </Text>
        </View>
      </View>

      {isActive ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text variant="caption" color="textMuted">
              {t(I18N_KEYS.map.download.progressLabel, {
                percent: Math.round(progressRatio * 100),
              })}
            </Text>
            {totalBytes > 0 ? (
              <Text variant="caption" color="textMuted">
                {t(I18N_KEYS.map.download.bytesLabel, {
                  downloaded: formatByteSize(progress.downloadedBytes),
                  total: formatByteSize(totalBytes),
                })}
              </Text>
            ) : null}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
        </View>
      ) : null}

      {isFailed ? (
        <View style={styles.errorBox}>
          <Text variant="body" color="danger" style={styles.errorText}>
            {t(I18N_KEYS.map.download.failed)}
          </Text>
        </View>
      ) : null}

      <Button
        label={
          isFailed
            ? t(I18N_KEYS.map.download.retry)
            : isActive
              ? t(I18N_KEYS.map.download.downloading)
              : t(I18N_KEYS.map.download.action)
        }
        loading={isDownloading}
        disabled={isDownloading}
        onPress={onDownload}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#1A1F24',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  glyphOuter: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyphFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#095C42',
    borderBottomLeftRadius: 4,
  },
  glyphPin: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.textOnPrimary,
  },
  title: {
    textAlign: 'center',
  },
  explanation: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  regionCard: {
    flexDirection: 'row',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  regionAccent: {
    width: 4,
    backgroundColor: colors.primary,
  },
  regionContent: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xs,
  },
});
