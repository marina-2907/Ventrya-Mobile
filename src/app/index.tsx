
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 35,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3200);

    return () => clearTimeout(timer);
  }, [fade, scale, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#08040E', '#10051C', '#1C082B']}
      style={styles.container}
    >
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ scale }],
            alignItems: 'center',
          }}
        >

<View style={styles.logoGlow}>
  <Svg width={120} height={120} viewBox="0 0 120 120">
    <Defs>
      <SvgGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#F6A4FF" />
        <Stop offset="0.45" stopColor="#D13AFF" />
        <Stop offset="1" stopColor="#8500D8" />
      </SvgGradient>
    </Defs>

    <Path
      d="M12 20
         C9 14 13 10 20 10
         H35
         C40 10 43 13 46 19
         L61 55
         L78 19
         C81 13 85 10 91 10
         H107
         C113 10 115 15 112 21
         L76 100
         C70 113 52 113 46 100
         Z"
      fill="url(#logoGradient)"
    />
  </Svg>
</View>

          <Text style={styles.title}>Ventrya</Text>

          <Text style={styles.subtitle}>
            Conectando desafios,{'\n'}
            conhecimento e evolução.
          </Text>
        </Animated.View>
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.waves,
          { height: Math.min(height * 0.28, 240) },
        ]}
      >
        <Svg width={120} height={120} viewBox="0 0 120 120" style={{ backgroundColor: 'transparent' }}>
          <Defs>
            <SvgGradient id="wave" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#550078" stopOpacity="0.1" />
              <Stop offset="0.5" stopColor="#D03BFF" stopOpacity="0.9" />
              <Stop offset="1" stopColor="#7B13C5" stopOpacity="0.15" />
            </SvgGradient>
          </Defs>

          {Array.from({ length: 12 }).map((_, i) => (
            <Path
              key={i}
              d={`M -40 ${145 + i * 5}
                  C 90 ${75 + i * 3},
                    180 ${210 - i * 4},
                    440 ${55 + i * 6}`}
              stroke="url(#wave)"
              strokeWidth="0.9"
              fill="none"
              opacity={0.85 - i * 0.045}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.loadingArea}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 2,
  },
 logoGlow: {
  width: 140,
  height: 140,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 0,
  backgroundColor: 'transparent',
},
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 76,
    fontWeight: '900',
    lineHeight: 92,
  },
  title: {
    fontSize: 49,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginTop: 5,
  },
  subtitle: {
    marginTop: 15,
    color: '#E1D3EC',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  waves: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.8,
  },
  loadingArea: {
    position: 'absolute',
    bottom: 65,
    alignSelf: 'center',
    width: 90,
    zIndex: 3,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#3B194C',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C64CFF',
    borderRadius: 10,
  },
});
