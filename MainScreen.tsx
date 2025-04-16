import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, NativeModules, Alert, Button, ToastAndroid, BackHandler, Platform, Linking, NativeEventEmitter, View, Text } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';
import WebView from 'react-native-webview';
import { useFetchAppSettings } from './useFetchAppSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PromptModal } from './PromptModal';

const webViewInfoEmitter = new NativeEventEmitter(NativeModules.WebViewInfo);

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
  const [shouldUpdateWebView, setShouldUpdateWebView] = useState<boolean>(false)

  const postMessage = useCallback((data: any) => {
    const script = `
    window.receiveNativeCommand(${JSON.stringify(data)})
    true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, [])

  useEffect(() => {
    const webviewPackagesMinMajorVersion: Record<string, number> = {
      'com.android.chrome': 111,
      'com.google.android.webview': 111,
    }
    function checkWebViewVersion(info: any) {
      console.log('WebViewInfo event:', info)
      const versionNameParts = info.versionName.split('.')
      const majorVersion = parseInt(versionNameParts[0], 10)
      const minimumVersion = webviewPackagesMinMajorVersion[info.packageName]
      if (!minimumVersion) {
        Alert.alert('Error de compatibilidad', `El componente WebView "${info.packageName}" no es compatible con la aplicación.`);
      }
      if (majorVersion < minimumVersion) {
        setShouldUpdateWebView(true)
      }
      else {
        setShouldUpdateWebView(false)
      }
    }

    const WebViewInfo = NativeModules.WebViewInfo

    const sub = webViewInfoEmitter.addListener('onUpdated', checkWebViewVersion);

    const packageName = WebViewInfo.getPackageName()
    const versionName = WebViewInfo.getVersionName()
    const versionCode = WebViewInfo.getVersionCode()
    checkWebViewVersion({ packageName, versionName, versionCode })

    return () => sub.remove();
  }, [])

  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    let lastBackPressed = 0;
    const backAction = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true; // Interceptamos el back para navegar hacia atrás
      } else {
        // Implementación de "doble toque" para salir
        const time = new Date().getTime();
        if (time - lastBackPressed < 2000) {
          // Si se presiona dos veces en menos de 2 segundos, se permite la salida
          return false;
        } else {
          lastBackPressed = time;
          ToastAndroid.show('Presiona de nuevo para salir', ToastAndroid.SHORT);
          return true; // Interceptamos el back para evitar cerrar inmediatamente
        }
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [canGoBack]);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.DeviceManagement);
    const subscription = eventEmitter.addListener('onLockStateChanged', (event) => {
      console.log('Lock state changed:', event.isLocked);
      const enrollmentData = NativeModules.DeviceManagement.getEnrollmentData();
      console.log("state", { locked: event.isLocked, enrollmentData })
      postMessage({ type: 'setState', payload: { locked: event.isLocked, enrollmentData } })
    });

    return () => subscription.remove();
  }, [])

  const { data: { webUrl } = {} } = useFetchAppSettings();

  if (!webUrl) return null;

  const renderErrorView = () => (
    <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
      <Text style={styles.errorText}>Ocurrió un error al cargar la aplicación.</Text>
      <Button
        title="Reintentar"
        onPress={() => {
          if (webViewRef) {
            webViewRef.current?.reload();
          }
        }}
      />
    </View>
  );

  return (
    <>
      <WebView
        ref={webViewRef}
        injectedJavaScript={debugging}
        style={{ display: loaded ? 'flex' : 'none' }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        source={{ uri: webUrl }}
        renderError={renderErrorView}
        onFileDownload={async ({ nativeEvent }) => {
          if (Platform.OS === 'android') {
            const result = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE)
            if (result !== 'granted') return
          }
          const { downloadUrl } = nativeEvent
          Linking.openURL(downloadUrl)
        }}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
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
              const pendingToken = AsyncStorage.getItem('deviceToken')

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
      <PromptModal
        visible={shouldUpdateWebView}
        title="Actualización requerida"
        message="Por favor actualiza tu WebView para continuar"
        onCancel={() => BackHandler.exitApp()}
        onAccept={() => Linking.openURL(`https://play.google.com/store/apps/details?id=${NativeModules.WebViewInfo.getPackageName()}`)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
  }
});

export default MainScreen;