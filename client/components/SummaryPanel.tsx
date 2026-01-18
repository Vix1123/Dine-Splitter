import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { PersonColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Person, ReceiptItem, PersonSummary } from "@/types/receipt";

interface SummaryPanelProps {
  items: ReceiptItem[];
  people: Person[];
  tipPercentage: number;
  currencySymbol: string;
  billTotal: number;
}

export function SummaryPanel({
  items,
  people,
  tipPercentage,
  currencySymbol,
  billTotal,
}: SummaryPanelProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  const { allocatedTotal, personSummaries } = useMemo(() => {
    const summaries: PersonSummary[] = [];
    let allocated = 0;

    people.forEach((person) => {
      const personItems: { description: string; quantity: number; price: number }[] = [];
      let subtotal = 0;

      items.forEach((item) => {
        const qty = item.allocations[person.id] || 0;
        if (qty > 0) {
          const itemTotal = (item.price / item.quantity) * qty;
          personItems.push({
            description: item.description,
            quantity: qty,
            price: itemTotal,
          });
          subtotal += itemTotal;
          allocated += itemTotal;
        }
      });

      const tip = subtotal * (tipPercentage / 100);

      summaries.push({
        person,
        items: personItems,
        subtotal,
        tip,
        total: subtotal + tip,
      });
    });

    return { allocatedTotal: allocated, personSummaries: summaries };
  }, [items, people, tipPercentage]);

  const outstanding = billTotal - allocatedTotal;
  const isComplete = outstanding <= 0.01;

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
    rotation.value = withSpring(isExpanded ? 0 : 180, { damping: 15 });
  };

  const statusColor = isComplete ? theme.success : theme.warning;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderColor: statusColor },
      ]}
    >
      <Pressable onPress={toggleExpand} style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>Summary</ThemedText>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.totalsPreview}>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
              {currencySymbol}
              {allocatedTotal.toFixed(2)} / {currencySymbol}
              {billTotal.toFixed(2)}
            </ThemedText>
          </View>
          <Animated.View style={chevronStyle}>
            <ThemedText style={[styles.chevron, { color: theme.text }]}>▼</ThemedText>
          </Animated.View>
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>
              Bill Total
            </ThemedText>
            <ThemedText style={styles.summaryValue}>
              {currencySymbol}
              {billTotal.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>
              Allocated
            </ThemedText>
            <ThemedText style={styles.summaryValue}>
              {currencySymbol}
              {allocatedTotal.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText
              style={{ color: isComplete ? theme.success : theme.warning }}
            >
              Outstanding
            </ThemedText>
            <ThemedText
              style={[
                styles.summaryValue,
                { color: isComplete ? theme.success : theme.warning },
              ]}
            >
              {currencySymbol}
              {outstanding.toFixed(2)}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {personSummaries.map((summary) => (
            <View key={summary.person.id} style={styles.personSummary}>
              <View style={styles.personHeader}>
                <View
                  style={[
                    styles.personDot,
                    {
                      backgroundColor:
                        PersonColors[
                          summary.person.colorIndex % PersonColors.length
                        ],
                    },
                  ]}
                />
                <ThemedText style={styles.personName}>
                  {summary.person.name}
                </ThemedText>
                <ThemedText style={[styles.personTotal, { color: theme.primary }]}>
                  {currencySymbol}
                  {summary.total.toFixed(2)}
                </ThemedText>
              </View>
              {summary.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <ThemedText
                    style={[styles.itemDesc, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {item.description}
                  </ThemedText>
                  <ThemedText
                    style={[styles.itemPrice, { color: theme.textSecondary }]}
                  >
                    {currencySymbol}
                    {item.price.toFixed(2)}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.itemRow}>
                <ThemedText
                  style={[styles.itemDesc, { color: theme.textTertiary }]}
                >
                  Subtotal
                </ThemedText>
                <ThemedText style={{ color: theme.textTertiary }}>
                  {currencySymbol}
                  {summary.subtotal.toFixed(2)}
                </ThemedText>
              </View>
              <View style={styles.itemRow}>
                <ThemedText
                  style={[styles.itemDesc, { color: theme.textTertiary }]}
                >
                  Tip ({tipPercentage}%)
                </ThemedText>
                <ThemedText style={{ color: theme.textTertiary }}>
                  {currencySymbol}
                  {summary.tip.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalsPreview: {
    marginRight: Spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
  },
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontWeight: "600",
  },
  personSummary: {
    marginTop: Spacing.md,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  personDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  personName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  personTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  itemDesc: {
    flex: 1,
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  itemPrice: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 12,
    fontWeight: "400",
  },
});
