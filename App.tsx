import React, { useEffect, useState } from 'react';
import BootSplash from "react-native-bootsplash";
import SplashVideo from './SplashVideo';
import MainScreen from './MainScreen';

const App = () => {
  const [mainScreenReady, setMainScreenReady] = useState(false);
  useEffect(() => {
    BootSplash.hide({ fade: true })
  }, [])

  console.log(mainScreenReady)
  return (
    <>
      {!mainScreenReady && (
        <SplashVideo />
      )}
      <MainScreen
        onReady={() => setMainScreenReady(true)}
      />
    </>
  );
};

export default App;
