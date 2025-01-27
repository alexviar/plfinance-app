import React, { useEffect, useState } from 'react';
import BootSplash from "react-native-bootsplash";
import SplashVideo from './SplashVideo';
import MainScreen from './MainScreen';
import { SafeAreaView, PermissionsAndroid, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
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
