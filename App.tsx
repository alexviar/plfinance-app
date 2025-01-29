import React, { useEffect, useState } from 'react';
import { NativeModules, PermissionsAndroid, SafeAreaView } from 'react-native';
import BootSplash from "react-native-bootsplash";
import MainScreen from './MainScreen';
import SplashVideo from './SplashVideo';

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
    async function requestPermissions() {
      const value = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
      console.log('PermissionStatus', value)
      setPostNotificationsPermissionStatus(value)
    }

    requestPermissions()

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
