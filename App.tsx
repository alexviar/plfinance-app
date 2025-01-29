import React, { useEffect, useState } from 'react';
import BootSplash from "react-native-bootsplash";
import SplashVideo from './SplashVideo';
import MainScreen from './MainScreen';
import { SafeAreaView, PermissionsAndroid, Alert, NativeModules } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const { DeviceManagement } = NativeModules

interface DeviceRegistration {
  token: string;
  // deviceId: string;
  // model: string;
  // manufacturer: string;
}

export class ApiService {
  private static BASE_URL = 'http://plfinancedev.eastus.cloudapp.azure.com:8000/api';

  static async registerDevice(token: string): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const response = await fetch(`${this.BASE_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          ...deviceInfo
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  private static async getDeviceInfo(): Promise<Omit<DeviceRegistration, 'token'>> {
    // const { Brand, Model } = await DeviceInfo.getConstants();
    // return {
    //   deviceId: await DeviceInfo.getUniqueId(),
    //   model: Model,
    //   manufacturer: Brand,
    // };
    return await Promise.resolve({})
  }
}

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
    messaging()
      .getToken()
      .then((token) => {
        console.log('ReactNativeLog', 'FCM Token:', token);
        ApiService.registerDevice(token);
      });
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
      .then((value) => {
        console.log('PermissionStatus', value)
        setPostNotificationsPermissionStatus(value)
      });
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
