import React, { useEffect, useState } from 'react';
import { NativeModules, PermissionsAndroid, SafeAreaView } from 'react-native';
import BootSplash from "react-native-bootsplash";
import MainScreen from './MainScreen';
import SplashVideo from './SplashVideo';

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
    messaging()
      .getToken()
      .then(console.log, console.error)
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
