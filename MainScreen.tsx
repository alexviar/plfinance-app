import messaging from '@react-native-firebase/messaging';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Animated, NativeModules, Alert, Button } from 'react-native';
import WebView from 'react-native-webview';

const debugging = `
  const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'event': 'Console', 'payload': {'type': type, 'log': log}}));
  console = {
    log: (log) => consoleLog('log', log),
    debug: (log) => consoleLog('debug', log),
    info: (log) => consoleLog('info', log),
    warn: (log) => consoleLog('warn', log),
    error: (log) => consoleLog('error', log),
  };
  true;
`;

type Props = {
  onReady?(): void
}

const MainScreen = ({ onReady }: Props) => {
  const webViewRef = useRef<WebView>(null);
  const [loaded, setLoaded] = React.useState(false);

  const postMessage = useCallback((data: any) => {
    // Creamos un script que despacha un evento 'message' con los datos
    const script = `
      (function() {
        const event = new MessageEvent('message', ${JSON.stringify(data)});
        window.dispatchEvent(event);
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, [])

  useEffect(() => {
    if (loaded) {
      const isLocked: boolean = NativeModules.DeviceManagement.isLocked();
      console.log("Locked", isLocked)
      postMessage({ event: 'lock' })
    }
  }, [loaded, postMessage])

  return (
    <>
      <WebView
        ref={webViewRef}
        injectedJavaScript={debugging}
        style={{ display: loaded ? 'flex' : 'none' }}
        source={{ uri: "https://plfinance.girchop.com" }}
        onMessage={async ({ nativeEvent: { data } }) => {
          try {
            const { event, payload } = JSON.parse(data);
            if (event === 'debug') {
              console.log(payload)
            } else if (event === 'unlock') {
              NativeModules.DeviceManagement.unlock();
            } else if (event === 'installments_received') {
              const pendingToken = messaging()
                .getToken()

              payload.forEach((installment: { id: number, dueDate: string }) => {
                NativeModules.DeviceManagement.scheduleDeviceLock(installment.id, String(Date.parse(installment.dueDate)));
              })

              let token
              try {
                token = await pendingToken
                console.log('ReactNativeLog', 'FCM Token:', token);
              } catch { }
              postMessage({ event: 'enroll_device', payload: { purchaseId: payload.purchaseId, token } })
            }
          } catch (error) {
            Alert.alert('Error al procesar el mensaje:' + error);
          }
        }}
        onLoadEnd={() => {
          setLoaded(true)
          onReady?.()
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MainScreen;