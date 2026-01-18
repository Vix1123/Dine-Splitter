import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TipSelectorProps {
  tipPercentage: number;
  onTipChange: (percentage: number) => void;
}

const TIP_PRESETS = [10, 15, 20];
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TipButton({
  percentage,
  isSelected,
  onPress,
}: {
  percentage: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

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
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.tipButton,
        {
          backgroundColor: isSelected
            ? theme.primary
            : theme.backgroundDefault,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        style={[
          styles.tipButtonText,
          { color: isSelected ? "#FFFFFF" : theme.text },
        ]}
      >
        {percentage}%
      </ThemedText>
    </AnimatedPressable>
  );
}

export function TipSelector({ tipPercentage, onTipChange }: TipSelectorProps) {
  const { theme } = useTheme();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const isCustom = !TIP_PRESETS.includes(tipPercentage);

  const handleCustomSubmit = () => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTipChange(value);
      setShowCustomModal(false);
      setCustomValue("");
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Tip</ThemedText>
      <View style={styles.buttonsRow}>
        {TIP_PRESETS.map((preset) => (
          <TipButton
            key={preset}
            percentage={preset}
            isSelected={tipPercentage === preset}
            onPress={() => onTipChange(preset)}
          />
        ))}
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCustomModal(true);
          }}
          style={[
            styles.tipButton,
            styles.customButton,
            {
              backgroundColor: isCustom ? theme.primary : theme.backgroundDefault,
              borderColor: isCustom ? theme.primary : theme.border,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.tipButtonText,
              { color: isCustom ? "#FFFFFF" : theme.text },
            ]}
          >
            {isCustom ? `${tipPercentage}%` : "Custom"}
          </ThemedText>
        </AnimatedPressable>
      </View>

      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowCustomModal(false)}
          />
          <View
            style={[styles.sheet, { backgroundColor: theme.backgroundRoot }]}
          >
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Custom Tip</ThemedText>
              <Pressable onPress={() => setShowCustomModal(false)} hitSlop={8}>
                <ThemedText style={[styles.closeButton, { color: theme.text }]}>✕</ThemedText>
              </Pressable>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={theme.textTertiary}
                value={customValue}
                onChangeText={(text) =>
                  setCustomValue(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                maxLength={3}
                autoFocus
              />
              <ThemedText style={styles.percentSign}>%</ThemedText>
            </View>
            <Button onPress={handleCustomSubmit} disabled={!customValue}>
              Set Tip
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tipButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  customButton: {
    flex: 1.5,
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  percentSign: {
    fontSize: 24,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  closeButton: {
    fontSize: 20,
    fontWeight: "400",
  },
});
