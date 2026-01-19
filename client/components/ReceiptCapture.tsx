import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image, Platform, Modal, Dimensions } from "react-native";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [showFullImage, setShowFullImage] = useState(false);

  const handleImagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFullImage(true);
  };

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
          <Pressable onPress={handleImagePress} style={styles.thumbnailContainer}>
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
            <View style={[styles.zoomHint, { backgroundColor: theme.backgroundRoot + "CC" }]}>
              <ThemedText style={[styles.zoomIcon, { color: theme.text }]}>🔍</ThemedText>
            </View>
          </Pressable>
          <View style={styles.receiptInfo}>
            {isLoading ? (
              <View style={[styles.analyzingContainer, { backgroundColor: theme.primary + "15" }]}>
                <ThemedText style={[styles.analyzingIcon, { color: theme.primary }]}>
                  ⟳
                </ThemedText>
                <ThemedText style={[styles.analyzingText, { color: theme.primary }]}>
                  Analyzing receipt...
                </ThemedText>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>
          {!isLoading ? (
            <Pressable
              onPress={onRetake}
              style={[
                styles.retakeButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText style={[styles.retakeIcon, { color: theme.text }]}>↻</ThemedText>
              <ThemedText style={styles.retakeText}>Retake</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <Modal
          visible={showFullImage}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFullImage(false)}
        >
          <Pressable
            style={styles.fullImageOverlay}
            onPress={() => setShowFullImage(false)}
          >
            <View style={[styles.fullImageContainer, { backgroundColor: theme.backgroundRoot }]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <Pressable
                style={[styles.closeImageButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowFullImage(false)}
              >
                <ThemedText style={[styles.closeImageText, { color: theme.text }]}>✕</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
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
            <ThemedText style={[styles.captureIcon, { color: theme.primary }]}>⟳</ThemedText>
            <ThemedText
              style={[styles.captureText, { color: theme.primary }]}
            >
              Analyzing receipt...
            </ThemedText>
          </View>
        ) : (
          <>
            <ThemedText style={[styles.captureIcon, { color: theme.textSecondary }]}>📷</ThemedText>
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
          <ThemedText style={[styles.galleryIcon, { color: theme.text }]}>🖼</ThemedText>
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
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  analyzingIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: "700",
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
  retakeIcon: {
    fontSize: 18,
    fontWeight: "600",
  },
  captureIcon: {
    fontSize: 40,
  },
  galleryIcon: {
    fontSize: 18,
  },
  thumbnailContainer: {
    position: "relative",
  },
  zoomHint: {
    position: "absolute",
    bottom: 4,
    right: 4,
    borderRadius: BorderRadius.xs,
    padding: 2,
  },
  zoomIcon: {
    fontSize: 12,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 120,
  },
  closeImageButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeImageText: {
    fontSize: 20,
    fontWeight: "600",
  },
});
