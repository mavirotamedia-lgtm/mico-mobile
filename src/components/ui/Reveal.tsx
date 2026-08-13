import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Icerigi hafif bir fade+slide-up ile sahneye sokar. Ekran acilislarinda ve
 * liste elemanlarinda (delay ile kademeli/stagger) kullanmak icin ortak
 * mikro-etkilesim primitifi.
 */
export function Reveal({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 4 }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
