import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from './types';
import { isNativeMapEngineAvailable } from './engine/native-module';
import { MapWebView, type MapWebViewProps } from './map/map-web-view';
import { MwmNativeMapView } from './map/mwm-native-map-view';

export type MwmMapViewProps = MapWebViewProps;

function useNativeMapAvailable(): boolean {
  const [available, setAvailable] = useState(() => isNativeMapEngineAvailable());

  useEffect(() => {
    setAvailable(isNativeMapEngineAvailable());
  }, []);

  return available;
}

export const MwmMapView: ComponentType<MwmMapViewProps> = function MwmMapView(props) {
  const nativeAvailable = useNativeMapAvailable();

  if (nativeAvailable) {
    return <MwmNativeMapView {...props} />;
  }

  return <MapWebView {...props} />;
};
