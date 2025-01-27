import React, { useEffect, useState } from 'react';
import BootSplash from "react-native-bootsplash";
import SplashVideo from './SplashVideo';
import MainScreen from './MainScreen';
import { SafeAreaView } from 'react-native';

const App = () => {
  const [mainScreenReady, setMainScreenReady] = useState(false);
  useEffect(() => {
    BootSplash.hide({ fade: true })
  }, [])

  console.log(mainScreenReady)
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
