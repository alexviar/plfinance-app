import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import WebView from 'react-native-webview';

type Props = {
  onReady?(): void
}

const MainScreen = ({ onReady }: Props) => {
  // const opacity = new Animated.Value(0);
  const [visible, setVisible] = React.useState(false)

  return (
    // <Animated.View style={[styles.container, { opacity }]}>
    <WebView
      style={{ display: visible ? 'flex' : 'none' }}
      source={{ uri: "http://192.168.0.101:5173/" }}
      onLoadEnd={() => {
        onReady?.()
        setVisible(true)
        // Animated.timing(opacity, {
        //   toValue: 1,
        //   duration: 300,
        //   useNativeDriver: true,
        // }).start();
      }}
    />
    // </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default MainScreen;