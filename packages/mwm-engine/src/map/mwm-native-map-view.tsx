import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from '../types';
import type { MapViewportBounds } from './map-config';
import { isNativeMapEngineAvailable } from '../engine/native-module';

export interface MwmNativeMapViewProps {
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
  onBoundsChange?: (bounds: MapViewportBounds) => void;
}

type NativeViewComponent = ComponentType<{
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
}>;

let cachedNativeView: NativeViewComponent | null | undefined;

function getNativeView(): NativeViewComponent | null {
  if (cachedNativeView !== undefined) {
    return cachedNativeView;
  }

  if (Platform.OS !== 'android' || !isNativeMapEngineAvailable()) {
    cachedNativeView = null;
    return null;
  }

  try {
    cachedNativeView = requireNativeViewManager('MwmEngineModule');
    return cachedNativeView;
  } catch {
    cachedNativeView = null;
    return null;
  }
}

export function MwmNativeMapView({
  style,
  pins = [],
  testID,
}: MwmNativeMapViewProps) {
  const [ViewComponent, setViewComponent] = useState<NativeViewComponent | null>(
    () => getNativeView(),
  );

  useEffect(() => {
    setViewComponent(getNativeView());
  }, []);

  if (!ViewComponent) {
    return null;
  }

  return <ViewComponent style={[styles.map, style]} pins={pins} testID={testID} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
