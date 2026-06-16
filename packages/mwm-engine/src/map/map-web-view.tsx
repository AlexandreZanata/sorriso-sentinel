import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MwmOccurrencePin } from '../types';
import { buildMapHtml } from './map-html';

export interface MapWebViewProps {
  style?: StyleProp<ViewStyle>;
  pins?: MwmOccurrencePin[];
  testID?: string;
}

export function MapWebView({ style, pins = [], testID }: MapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(() => buildMapHtml(), []);

  useEffect(() => {
    const payload = JSON.stringify(pins);
    webViewRef.current?.injectJavaScript(`window.updatePins(${payload}); true;`);
  }, [pins]);

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
