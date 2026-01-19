import React from "react";
import { StyleSheet, View, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { PersonColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Person, ReceiptItem } from "@/types/receipt";

interface EditAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  onReassign: (personId: string) => void;
  onClear: () => void;
  item: ReceiptItem | null;
  people: Person[];
  currencySymbol: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PersonOption({
  person,
  isCurrentlyAssigned,
  onPress,
}: {
  person: Person;
  isCurrentlyAssigned: boolean;
  onPress: () => void;
}) {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.personOption,
        {
          backgroundColor: isCurrentlyAssigned
            ? personColor + "20"
            : theme.backgroundDefault,
          borderColor: personColor,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: personColor }]} />
      <ThemedText style={styles.personName} numberOfLines={1}>
        {person.name}
      </ThemedText>
      {isCurrentlyAssigned ? (
        <ThemedText style={[styles.currentBadge, { color: personColor }]}>
          Current
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

export function EditAssignmentModal({
  visible,
  onClose,
  onReassign,
  onClear,
  item,
  people,
  currencySymbol,
}: EditAssignmentModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const currentAssignments = Object.entries(item.allocations).filter(
    ([_, qty]) => qty > 0
  );
  const assignedPersonIds = currentAssignments.map(([id]) => id);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: Math.max(insets.bottom, Spacing.xl),
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText style={styles.title} numberOfLines={1}>
                {item.description}
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                {currencySymbol}
                {item.price.toFixed(2)}
                {item.quantity > 1 ? ` (x${item.quantity})` : ""}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <ThemedText style={[styles.closeButton, { color: theme.text }]}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Reassign to
          </ThemedText>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.optionsList}
            showsVerticalScrollIndicator={false}
          >
            {people.map((person) => (
              <PersonOption
                key={person.id}
                person={person}
                isCurrentlyAssigned={assignedPersonIds.includes(person.id)}
                onPress={() => onReassign(person.id)}
              />
            ))}
          </ScrollView>

          <Pressable
            onPress={handleClear}
            style={[
              styles.clearButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText style={[styles.clearButtonText, { color: theme.error }]}>
              Clear Assignment
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
    paddingTop: Spacing.md,
    maxHeight: "70%",
    minHeight: 280,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    fontSize: 20,
    fontWeight: "400",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  personOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  personName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
