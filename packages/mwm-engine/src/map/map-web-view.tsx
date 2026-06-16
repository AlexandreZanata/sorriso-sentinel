import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from '../types';
import type { MapViewportBounds } from './map-config';
import { buildMapHtml } from './map-html';

export interface MapWebViewProps {
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
  onBoundsChange?: (bounds: MapViewportBounds) => void;
}

export function MapWebView({
  style,
  pins = [],
  testID,
  onBoundsChange,
}: MapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(() => buildMapHtml(), []);

  useEffect(() => {
    const payload = JSON.stringify(pins);
    webViewRef.current?.injectJavaScript(`window.updatePins(${payload}); true;`);
  }, [pins]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      if (!onBoundsChange) {
        return;
      }

      try {
        const parsed = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          minLatitude?: number;
          maxLatitude?: number;
          minLongitude?: number;
          maxLongitude?: number;
        };

        if (
          parsed.type !== 'bounds' ||
          typeof parsed.minLatitude !== 'number' ||
          typeof parsed.maxLatitude !== 'number' ||
          typeof parsed.minLongitude !== 'number' ||
          typeof parsed.maxLongitude !== 'number'
        ) {
          return;
        }

        onBoundsChange({
          minLatitude: parsed.minLatitude,
          maxLatitude: parsed.maxLatitude,
          minLongitude: parsed.minLongitude,
          maxLongitude: parsed.maxLongitude,
        });
      } catch {
        return;
      }
    },
    [onBoundsChange],
  );

  return (
    <WebView
      ref={webViewRef}
      testID={testID}
      style={[styles.map, style]}
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      mixedContentMode="always"
      onMessage={handleMessage}
      onLoadEnd={() => {
        const payload = JSON.stringify(pins);
        webViewRef.current?.injectJavaScript(`window.updatePins(${payload}); true;`);
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
