import Pushy from 'pushy-react-native';
import React, { useEffect, useState } from 'react';
import { NativeModules, PermissionsAndroid, SafeAreaView } from 'react-native';
import BootSplash from "react-native-bootsplash";
import MainScreen from './MainScreen';
import SplashVideo from './SplashVideo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DeviceManagement } = NativeModules

Pushy.setNotificationListener(async (data: any) => {
  console.log('Received notification: ', data);

  let notificationTitle = 'P&L Finance';

  let notificationText = data.message;

  Pushy.notify(notificationTitle, notificationText, data);

  Pushy.setBadge(0);

  const { type } = data.event as any
  if (type == 'lock') {
    DeviceManagement.lock();
  } else if (type == 'unlock') {
    DeviceManagement.unlock();
  } else if (type == 'release') {
    DeviceManagement.release();
  }
});

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
    Pushy.toggleForegroundService(true)
    Pushy.listen()
    Pushy.register()
      .then(async deviceToken => {
        const currentDeviceToken = await AsyncStorage.getItem('deviceToken')
        if (currentDeviceToken === deviceToken) return

        console.log('DeviceToken', deviceToken)
        AsyncStorage.setItem('deviceToken', deviceToken)

      })
      .catch(err => {
        console.error('Registration failed: ' + err.message);
      });
  }, [])

  useEffect(() => {
    DeviceManagement.disallowFactoryReset()
  }, [])

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
