import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import Video from 'react-native-video';
import SystemNavigationBar from 'react-native-system-navigation-bar';

type Props = {
  onVideoEnd?(): void
}

const SplashVideo = ({ onVideoEnd }: Props) => {
  React.useEffect(() => {
    // StatusBar.setTranslucent(true);
    // StatusBar.setBackgroundColor('transparent');
    // SystemNavigationBar.setNavigationColor('transparent', 'dark');
  }, []);

  const handleVideoEnd = () => {
    console.log('Video playback finished');
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Video
        source={require('./assets/splash.mp4')}
        style={styles.video}
        resizeMode="cover"
        repeat={false}
        controls={false}
        onEnd={handleVideoEnd}
        onError={(error) => console.log('Video Error:', error)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SplashVideo;