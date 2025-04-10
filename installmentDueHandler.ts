import { AppRegistry, NativeModules } from 'react-native';

async function handleInstallmentDue() {
  console.log("Locking device")
  NativeModules.DeviceManagement.lock()
}

AppRegistry.registerHeadlessTask('handleInstallmentDue', () => handleInstallmentDue);
