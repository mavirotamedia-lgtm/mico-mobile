import { useRef } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { haptics } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

/**
 * Card/Button gibi dokunulabilir tum primitiflerin ortak temeli — basinca
 * hafif bir "scale down" (Apple'in kart/buton dokunma tepkisine benzer) ve
 * (istege bagli) hafif bir haptic tik verir. Sade Pressable'in opacity-only
 * geri bildirimi statik hissettiriyordu.
 *
 * Animated.createAnimatedComponent(Pressable) kullaniliyor — Pressable'i
 * Animated.View ile sarmalamak, style'daki flex/margin gibi layout
 * ozelliklerinin bir ic seviyeye hapsolup dis flex kapsayicisina dogru
 * yayilmamasina yol acardi (ozellikle Button'in flex:1 satir duzenlerinde).
 */
export function Touchable({ style, scaleTo = 0.97, haptic = false, onPressIn, onPressOut, onPress, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics.tap();
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    />
  );
}
