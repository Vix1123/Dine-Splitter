import React, { useMemo } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { PersonColors, Spacing, BorderRadius } from "@/constants/theme";
import type { ReceiptItem as ReceiptItemType, Person } from "@/types/receipt";

interface ReceiptItemProps {
  item: ReceiptItemType;
  currencySymbol: string;
  selectedQuantity: number;
  onQuantityChange: (quantity: number) => void;
  people: Person[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReceiptItem({
  item,
  currencySymbol,
  selectedQuantity,
  onQuantityChange,
  people,
}: ReceiptItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const totalAllocated = useMemo(() => {
    return Object.values(item.allocations).reduce((sum, qty) => sum + qty, 0);
  }, [item.allocations]);

  const isFullyAllocated = totalAllocated >= item.quantity;
  const unallocated = item.quantity - totalAllocated;

  const assignedPerson = useMemo(() => {
    if (!isFullyAllocated) return null;
    const entries = Object.entries(item.allocations);
    if (entries.length === 1) {
      const [personId] = entries[0];
      return people.find((p) => p.id === personId);
    }
    return null;
  }, [item.allocations, isFullyAllocated, people]);

  const borderColor = assignedPerson
    ? PersonColors[assignedPerson.colorIndex % PersonColors.length]
    : theme.border;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isFullyAllocated) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleCheckboxPress = () => {
    if (isFullyAllocated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onQuantityChange(selectedQuantity > 0 ? 0 : 1);
  };

  const handleIncrement = () => {
    if (selectedQuantity < unallocated) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onQuantityChange(selectedQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (selectedQuantity > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onQuantityChange(selectedQuantity - 1);
    }
  };

  const renderSelector = () => {
    if (isFullyAllocated) {
      return (
        <View style={styles.allocatedBadge}>
          <Feather name="check" size={16} color={theme.primary} />
        </View>
      );
    }

    if (item.quantity === 1) {
      return (
        <Pressable
          onPress={handleCheckboxPress}
          style={[
            styles.checkbox,
            {
              borderColor: selectedQuantity > 0 ? theme.primary : theme.border,
              backgroundColor:
                selectedQuantity > 0 ? theme.primary : "transparent",
            },
          ]}
        >
          {selectedQuantity > 0 ? (
            <Feather name="check" size={14} color="#FFFFFF" />
          ) : null}
        </Pressable>
      );
    }

    return (
      <View style={styles.stepper}>
        <Pressable
          onPress={handleDecrement}
          style={[
            styles.stepperButton,
            {
              backgroundColor:
                selectedQuantity > 0
                  ? theme.backgroundSecondary
                  : theme.backgroundDefault,
              opacity: selectedQuantity > 0 ? 1 : 0.5,
            },
          ]}
        >
          <ThemedText style={[styles.stepperIcon, { color: theme.text }]}>-</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepperValue}>
          {selectedQuantity}/{unallocated}
        </ThemedText>
        <Pressable
          onPress={handleIncrement}
          style={[
            styles.stepperButton,
            {
              backgroundColor:
                selectedQuantity < unallocated
                  ? theme.backgroundSecondary
                  : theme.backgroundDefault,
              opacity: selectedQuantity < unallocated ? 1 : 0.5,
            },
          ]}
        >
          <ThemedText style={[styles.stepperIcon, { color: theme.text }]}>+</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: borderColor,
          borderWidth: assignedPerson ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <ThemedText style={styles.description} numberOfLines={2}>
            {item.description}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText style={[styles.price, { color: theme.textSecondary }]}>
              {currencySymbol}
              {item.price.toFixed(2)}
              {item.quantity > 1 ? ` x${item.quantity}` : ""}
            </ThemedText>
            {totalAllocated > 0 && !isFullyAllocated ? (
              <ThemedText
                style={[styles.allocation, { color: theme.textTertiary }]}
              >
                {totalAllocated}/{item.quantity} allocated
              </ThemedText>
            ) : null}
          </View>
        </View>
        {renderSelector()}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 14,
  },
  allocation: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: Spacing.sm,
    minWidth: 40,
    textAlign: "center",
  },
  stepperIcon: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  allocatedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
