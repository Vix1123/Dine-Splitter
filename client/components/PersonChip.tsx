import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { PersonColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Person } from "@/types/receipt";

interface PersonChipProps {
  person: Person;
  isSelected?: boolean;
  onPress?: () => void;
  showTotal?: boolean;
  total?: number;
  currencySymbol?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PersonChip({
  person,
  isSelected = false,
  onPress,
  showTotal = false,
  total = 0,
  currencySymbol = "$",
}: PersonChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const personColor = PersonColors[person.colorIndex % PersonColors.length];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? personColor + "20"
            : theme.backgroundDefault,
          borderColor: isSelected ? personColor : theme.border,
          borderWidth: isSelected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: personColor }]} />
      <ThemedText style={styles.name} numberOfLines={1}>
        {person.name}
      </ThemedText>
      {showTotal ? (
        <ThemedText style={[styles.total, { color: theme.textSecondary }]}>
          {currencySymbol}
          {total.toFixed(2)}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  total: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
});
