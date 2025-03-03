import messaging from '@react-native-firebase/messaging';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Animated, NativeModules, Alert, Button } from 'react-native';
import WebView from 'react-native-webview';

const debugging = `
  const consoleLog = (type, log) => window.ReactNativeWebView.postMessage(JSON.stringify({'event': 'debug', 'payload': {'type': type, 'log': log}}));
  console = {
    log: (...log) => consoleLog('log', log),
    debug: (...log) => consoleLog('debug', log),
    info: (...log) => consoleLog('info', log),
    warn: (...log) => consoleLog('warn', log),
    error: (...log) => consoleLog('error', log),
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
    const script = `
    window.receiveNativeCommand(${JSON.stringify(data)})
    true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, [])

  return (
    <>
      <WebView
        ref={webViewRef}
        injectedJavaScript={debugging}
        style={{ display: loaded ? 'flex' : 'none' }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        source={{ uri: "https://plfinance.girchop.com" }}
        onMessage={async ({ nativeEvent: { data } }) => {
          try {
            const { event, payload } = JSON.parse(data);
            if (event === 'debug') {
              console.log("Webview", payload)
            } else if (event === 'getState') {
              const locked: boolean = NativeModules.DeviceManagement.isLocked();
              const enrollmentData = NativeModules.DeviceManagement.getEnrollmentData();
              console.log("getState", { locked, enrollmentData })
              postMessage({ type: 'setState', payload: { locked, enrollmentData } })
            } else if (event === 'unlock') {
              NativeModules.DeviceManagement.unlock();
            } else if (event === 'installment_paid') {
              NativeModules.DeviceManagement.cancelDeviceLock(payload.installmentId);
            } else if (event === 'enroll_device') {
              const pendingToken = messaging()
                .getToken()

              console.log(payload);
              NativeModules.DeviceManagement.enroll(payload);

              let token
              try {
                token = await pendingToken
                console.log('ReactNativeLog', 'FCM Token:', token);
              } catch { }
              postMessage({ type: 'finish_device_enrollment', payload: { deviceId: payload.deviceId, token } })
            }
          } catch (error) {
            console.log(error)
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