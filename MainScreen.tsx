import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  onReady?(): void
}

const MainScreen = ({ onReady }: Props) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Simular carga de recursos
    setTimeout(() => {
      onReady?.();
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, [])

  // useEffect(() => {
  //   if (visible) {
  //     Animated.timing(opacity, {
  //       toValue: 1,
  //       duration: 300,
  //       useNativeDriver: true,
  //     }).start();
  //   }

  // }, [visible]);

  // if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>🚧 En Construcción 🚧</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#FFFFFF',
  },
});

export default MainScreen;