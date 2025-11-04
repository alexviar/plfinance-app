import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, onMessage, onTokenRefresh, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';
import Pushy from 'pushy-react-native';
import React, { useEffect, useState } from 'react';
import { NativeModules, PermissionsAndroid, SafeAreaView } from 'react-native';
import BootSplash from "react-native-bootsplash";
import MainScreen from './MainScreen';
import SplashVideo from './SplashVideo';

const { DeviceManagement, Updater } = NativeModules

Pushy.setNotificationListener(async (data: any) => {
  console.log('Received notification: ', data);

  if (data.message) {
    let notificationTitle = 'P&L Finance';

    let notificationText = data.message;

    Pushy.notify(notificationTitle, notificationText, data);

    Pushy.setBadge(0);
  }

  const { type, payload } = JSON.parse(data.event)
  if (type == 'lock') {
    DeviceManagement.lock();
  } else if (type == 'unlock') {
    DeviceManagement.unlock();
  } else if (type == 'release') {
    DeviceManagement.release();
  } else if (type == 'installment_paid') {
    DeviceManagement.cancelDeviceLock(payload.installment_id);
  } else if (type == 'update') {
    Updater.downloadAndInstallApk(payload.downloadUrl);
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
    const registerDevice = async () => {
      await registerDeviceForRemoteMessages(messaging)
      const token = await getToken(messaging)
      updateToken(token)
    }

    const updateToken = async (deviceToken: string) => {
      const currentDeviceToken = await AsyncStorage.getItem('deviceToken')
      if (currentDeviceToken === deviceToken) return

      AsyncStorage.setItem('deviceToken', deviceToken)
    }

    const messaging = getMessaging(getApp())

    onTokenRefresh(messaging, updateToken)

    registerDevice().catch(err => console.error('Registration failed: ' + err.message));
  }, [])


  useEffect(() => {
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      console.log(JSON.stringify(remoteMessage))
      const { type, payload } = remoteMessage.data as any
      if (type == 'lock') {
        DeviceManagement.lock();
      } else if (type == 'unlock') {
        DeviceManagement.unlock();
      } else if (type == 'release') {
        DeviceManagement.release();
      } else if (type == 'installment_paid') {
        DeviceManagement.cancelDeviceLock(JSON.parse(payload).installment_id);
      } else if (type == 'update') {
        Updater.downloadAndInstallApk(JSON.parse(payload).downloadUrl);
      }
    });

    return unsubscribe;
  }, []);

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
