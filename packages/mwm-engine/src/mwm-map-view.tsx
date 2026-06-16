import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from './types';
import { MapWebView, type MapWebViewProps } from './map/map-web-view';

export type MwmMapViewProps = MapWebViewProps;

export const MwmMapView: ComponentType<MwmMapViewProps> = MapWebView;
