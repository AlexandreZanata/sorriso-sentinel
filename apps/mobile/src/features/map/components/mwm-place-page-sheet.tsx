import { Linking, Pressable, StyleSheet, View } from 'react-native';
import type { MwmPlacePage } from '@sorriso-sentinel/mwm-engine';
import { I18N_KEYS } from '../../../i18n/keys';
import { useTranslation } from '../../../i18n/i18n-provider';
import { Text } from '../../../ui/atoms/text';
import { colors } from '../../../ui/theme/colors';
import { spacing } from '../../../ui/theme/spacing';

export interface MwmPlacePageSheetProps {
  place: MwmPlacePage;
  onDismiss: () => void;
}

export function MwmPlacePageSheet({ place, onDismiss }: MwmPlacePageSheetProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text variant="subtitle">{place.title}</Text>
          {place.subtitle ? (
            <Text variant="caption" color="textMuted">
              {place.subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text variant="caption" color="primary">
            {t(I18N_KEYS.map.placePage.close)}
          </Text>
        </Pressable>
      </View>

      {place.address ? (
        <Text variant="body">{place.address}</Text>
      ) : null}

      {place.phone ? (
        <Pressable onPress={() => void Linking.openURL(`tel:${place.phone}`)}>
          <Text variant="body" color="primary">
            {place.phone}
          </Text>
        </Pressable>
      ) : null}

      {place.website ? (
        <Pressable
          onPress={() => {
            const url = place.website?.startsWith('http')
              ? place.website
              : `https://${place.website}`;
            void Linking.openURL(url);
          }}
        >
          <Text variant="body" color="primary">
            {place.website}
          </Text>
        </Pressable>
      ) : null}

      {place.wikiDescription ? (
        <Text variant="caption" color="textMuted">
          {place.wikiDescription}
        </Text>
      ) : null}

      {place.osmDescription ? (
        <Text variant="caption" color="textMuted">
          {place.osmDescription}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titles: {
    flex: 1,
    gap: spacing.xs,
  },
});
