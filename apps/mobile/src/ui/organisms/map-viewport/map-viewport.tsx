import type { MapViewportBounds, MwmOccurrencePin } from '@sorriso-sentinel/mwm-engine';
import { StyleSheet, View } from 'react-native';
import { MwmMapView } from '@sorriso-sentinel/mwm-engine';

export interface MapViewportProps {
  pins: MwmOccurrencePin[];
  onBoundsChange?: (bounds: MapViewportBounds) => void;
}

export function MapViewport({ pins, onBoundsChange }: MapViewportProps) {
  return (
    <View style={styles.container}>
      <MwmMapView
        style={styles.map}
        pins={pins}
        onBoundsChange={onBoundsChange}
        testID="mwm-map-view"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
