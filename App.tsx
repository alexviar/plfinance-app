import React, { useEffect, useState } from 'react';
import BootSplash from "react-native-bootsplash";
import SplashVideo from './SplashVideo';
import MainScreen from './MainScreen';
import { SafeAreaView, PermissionsAndroid, Alert, NativeModules, BackHandler } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const { DeviceManagement } = NativeModules

const App = () => {
  const [mainScreenReady, setMainScreenReady] = useState(false);
  useEffect(() => {
    BootSplash.hide({ fade: true })
  }, [])

  const [
    postNotificationsPermissionStatus,
    setPostNotificationsPermissionStatus
  ] = useState<string | null>(null)
  useEffect(() => {
    async function requestPermissions() {
      const value = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
      console.log('PermissionStatus', value)
      setPostNotificationsPermissionStatus(value)
    }

    requestPermissions()

  }, [])

  useEffect(() => {
    console.log("Hola mundo")
  }, [])

  useEffect(() => {
    // if (postNotificationsPermissionStatus !== 'granted') return

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('ReactNativeLog', JSON.stringify(remoteMessage))
      const { command } = remoteMessage.data as any
      if (command == 'lock') {
        DeviceManagement.lock();
      } else if (command == 'unlock') {
        DeviceManagement.unlock();
      } else if (command == 'release') {
        DeviceManagement.release();
      }
    });

    return unsubscribe;
  }, [postNotificationsPermissionStatus]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {!mainScreenReady && (
        <SplashVideo />
      )}
      <MainScreen
        onReady={() => setMainScreenReady(true)}
      />
    </SafeAreaView>
  );
};

export default App;
