import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from './types';
import { MapWebView } from './map/map-web-view';

export interface MwmMapViewProps {
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
}

export const MwmMapView: ComponentType<MwmMapViewProps> = MapWebView;
