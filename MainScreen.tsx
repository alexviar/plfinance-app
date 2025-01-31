import messaging from '@react-native-firebase/messaging';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, NativeModules, Alert } from 'react-native';
import WebView from 'react-native-webview';

type Props = {
  onReady?(): void
}

const MainScreen = ({ onReady }: Props) => {
  const webViewRef = useRef<WebView>(null);
  const [visible, setVisible] = React.useState(false)

  useEffect(() => {
    const isLocked: boolean = NativeModules.DeviceManagement.isLocked();
    webViewRef.current?.injectJavaScript(`localStorage.setItem('locked', String(${isLocked ? 'true' : 'false'}))`)
  }, [])

  return (
    <WebView
      ref={webViewRef}
      style={{ display: visible ? 'flex' : 'none' }}
      source={{ uri: "http://plfinancedev.eastus.cloudapp.azure.com" }}
      onMessage={async ({ nativeEvent: { data } }) => {
        try {
          const { event, payload } = JSON.parse(data);
          if (event === 'installments_received') {
            console.log("Hola")
            const pendingToken = messaging()
              .getToken()
            console.log("Mundo")
            payload.forEach((installment: { id: number, dueDate: string }) => {
              NativeModules.DeviceManagement.scheduleDeviceLock(installment.id, Date.parse(installment.dueDate));
            })
            let token
            try {
              token = await pendingToken
              console.log('ReactNativeLog', 'FCM Token:', token);
            } catch { }
            webViewRef.current?.injectJavaScript(`registerDevice(${payload.purchaseId}, ${token ?? 'null'})`)
          }
        } catch (error) {
          Alert.alert('Error al procesar el mensaje:' + error);
        }
      }}
      onLoadEnd={() => {
        onReady?.()
        setVisible(true)
      }}
    />
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