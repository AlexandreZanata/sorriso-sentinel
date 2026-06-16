import { requireNativeViewManager } from 'expo-modules-core';
import type { ComponentType } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from './types';

export interface MwmMapViewProps {
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
}

type NativeProps = MwmMapViewProps;
let NativeMwmMapView: ComponentType<NativeProps> | null = null;

try {
  NativeMwmMapView = requireNativeViewManager(
    'MwmEngineModule',
  ) as ComponentType<NativeProps>;
} catch {
  NativeMwmMapView = null;
}

export function MwmMapView(props: MwmMapViewProps) {
  if (!NativeMwmMapView) {
    return <View style={props.style} testID={props.testID} />;
  }

  return <NativeMwmMapView {...props} />;
}
