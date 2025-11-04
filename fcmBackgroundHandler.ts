import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { NativeModules } from 'react-native';

const { DeviceManagement, Updater } = NativeModules

// Register background handler
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  console.log('Message handled in the background!', JSON.stringify(remoteMessage));
  const { type, payload } = remoteMessage.data as any
  if (type == 'unlock') {
    DeviceManagement.unlock();
  } else if (type == 'release') {
    DeviceManagement.release();
  } else if (type == 'release') {
    DeviceManagement.release();
  } else if (type == 'installment_paid') {
    DeviceManagement.cancelDeviceLock(JSON.parse(payload).installment_id);
  } else if (type == 'update') {
    Updater.downloadAndInstallApk(JSON.parse(payload).downloadUrl);
  }
});