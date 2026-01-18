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
import type { Person } from "@/types/receipt";

interface AssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (personId: string) => void;
  people: Person[];
  selectedCount: number;
  currencySymbol: string;
  personTotals: { [personId: string]: number };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PersonCard({
  person,
  total,
  currencySymbol,
  onPress,
}: {
  person: Person;
  total: number;
  currencySymbol: string;
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
        styles.personCard,
        { backgroundColor: theme.backgroundDefault, borderColor: personColor },
        animatedStyle,
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: personColor }]} />
      <ThemedText style={styles.personName} numberOfLines={1}>
        {person.name}
      </ThemedText>
      <ThemedText style={[styles.personTotal, { color: theme.textSecondary }]}>
        {currencySymbol}
        {total.toFixed(2)}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function AssignmentModal({
  visible,
  onClose,
  onAssign,
  people,
  selectedCount,
  currencySymbol,
  personTotals,
}: AssignmentModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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
            <ThemedText style={styles.title}>
              Assign {selectedCount} item{selectedCount !== 1 ? "s" : ""} to
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <ThemedText style={[styles.closeButton, { color: theme.text }]}>
                ✕
              </ThemedText>
            </Pressable>
          </View>
          {people.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No people added yet. Add people first to assign items.
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={true}
            >
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  total={personTotals[person.id] || 0}
                  currencySymbol={currencySymbol}
                  onPress={() => onAssign(person.id)}
                />
              ))}
            </ScrollView>
          )}
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
    maxHeight: "60%",
    minHeight: 200,
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 20,
    fontWeight: "400",
  },
  scrollView: {
    flexGrow: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  personCard: {
    width: "48%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  personName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  personTotal: {
    fontSize: 14,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
