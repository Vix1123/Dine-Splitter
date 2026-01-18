import React from "react";
import { StyleSheet, View, Pressable, Image, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ReceiptCaptureProps {
  imageUri: string | null;
  currency: string | null;
  total: number | null;
  currencySymbol: string;
  onCapture: () => void;
  onPickFromGallery: () => void;
  onRetake: () => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReceiptCapture({
  imageUri,
  currency,
  total,
  currencySymbol,
  onCapture,
  onPickFromGallery,
  onRetake,
  isLoading = false,
}: ReceiptCaptureProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCapture();
  };

  const handleGallery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPickFromGallery();
  };

  if (imageUri) {
    return (
      <View style={styles.capturedContainer}>
        <View style={styles.imageRow}>
          <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          <View style={styles.receiptInfo}>
            {currency ? (
              <View
                style={[
                  styles.currencyBadge,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText style={styles.currencyText}>{currency}</ThemedText>
              </View>
            ) : null}
            {total !== null ? (
              <ThemedText style={styles.totalText}>
                {currencySymbol}
                {total.toFixed(2)}
              </ThemedText>
            ) : null}
          </View>
          <Pressable
            onPress={onRetake}
            style={[
              styles.retakeButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="refresh-cw" size={18} color={theme.text} />
            <ThemedText style={styles.retakeText}>Retake</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <AnimatedPressable
        onPress={handleCapture}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        style={[
          styles.captureBox,
          {
            borderColor: theme.border,
            backgroundColor: theme.backgroundDefault,
            opacity: isLoading ? 0.6 : 1,
          },
          animatedStyle,
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Feather name="loader" size={40} color={theme.textSecondary} />
            <ThemedText
              style={[styles.captureText, { color: theme.textSecondary }]}
            >
              Processing receipt...
            </ThemedText>
          </View>
        ) : (
          <>
            <Feather name="camera" size={40} color={theme.textSecondary} />
            <ThemedText
              style={[styles.captureText, { color: theme.textSecondary }]}
            >
              Tap to scan receipt
            </ThemedText>
            <ThemedText
              style={[styles.captureSubtext, { color: theme.textTertiary }]}
            >
              or upload from gallery
            </ThemedText>
          </>
        )}
      </AnimatedPressable>

      {!isLoading && Platform.OS !== "web" ? (
        <Pressable
          onPress={handleGallery}
          style={[
            styles.galleryButton,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="image" size={18} color={theme.text} />
          <ThemedText style={styles.galleryText}>
            Upload from gallery
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  captureBox: {
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  captureText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  captureSubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  galleryText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    fontWeight: "500",
  },
  capturedContainer: {
    marginBottom: Spacing.lg,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  receiptInfo: {
    flex: 1,
  },
  currencyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalText: {
    fontSize: 24,
    fontWeight: "700",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retakeText: {
    marginLeft: Spacing.xs,
    fontSize: 14,
    fontWeight: "500",
  },
});
