/**
 * @format
 */

import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

const { DeviceManagement } = NativeModules;

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('ReactNativeLog', 'Message handled in the background!', remoteMessage);
  const { command } = remoteMessage.data
  if (command == 'lock') {
    DeviceManagement.lock();
  }
  else if (command == 'release') {
    DeviceManagement.release()
  }
});

AppRegistry.registerComponent(appName, () => App);

