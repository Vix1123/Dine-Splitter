import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as Localization from "expo-localization";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ReceiptCapture } from "@/components/ReceiptCapture";
import { PersonChip } from "@/components/PersonChip";
import { ReceiptItem } from "@/components/ReceiptItem";
import { AddPersonModal } from "@/components/AddPersonModal";
import { AssignmentModal } from "@/components/AssignmentModal";
import { TipSelector } from "@/components/TipSelector";
import { SummaryPanel } from "@/components/SummaryPanel";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, PersonColors } from "@/constants/theme";
import { getCurrencySymbol, formatCurrency, getCurrencyFromRegion } from "@/utils/currency";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type {
  Person,
  ReceiptItem as ReceiptItemType,
} from "@/types/receipt";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SplitScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItemType[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<{
    [itemId: string]: number;
  }>({});
  const [tipPercentage, setTipPercentage] = useState(15);
  const [currency, setCurrency] = useState<string | null>(null);
  const [billTotal, setBillTotal] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const currencySymbol = currency ? getCurrencySymbol(currency) : "$";

  const selectedCount = useMemo(() => {
    return Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [selectedQuantities]);

  const personTotals = useMemo(() => {
    const totals: { [personId: string]: number } = {};
    people.forEach((p) => {
      totals[p.id] = 0;
    });
    items.forEach((item) => {
      Object.entries(item.allocations).forEach(([personId, qty]) => {
        const itemPrice = (item.price / item.quantity) * qty;
        totals[personId] = (totals[personId] || 0) + itemPrice;
      });
    });
    return totals;
  }, [items, people]);

  const allocatedTotal = useMemo(() => {
    return Object.values(personTotals).reduce((sum, val) => sum + val, 0);
  }, [personTotals]);

  const isComplete = billTotal > 0 && Math.abs(billTotal - allocatedTotal) < 0.01;

  const filteredItems = useMemo(() => {
    if (!filterPerson) return items;
    return items.filter((item) => {
      const allocated = item.allocations[filterPerson] || 0;
      return allocated > 0;
    });
  }, [items, filterPerson]);

  const handleCapture = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Camera Not Available",
        "Please run the app in Expo Go to use the camera feature."
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to scan receipts."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processReceipt(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed to upload receipts."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processReceipt(result.assets[0].uri);
    }
  };

  const processReceipt = async (uri: string) => {
    setIsLoading(true);
    setImageUri(uri);
    setWarning(null);

    try {
      const formData = new FormData();
      
      const filename = uri.split("/").pop() || "receipt.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      
      formData.append("receipt", {
        uri,
        name: filename,
        type,
      } as any);
      
      // Get device locale for currency fallback
      const locales = Localization.getLocales();
      const regionCode = locales[0]?.regionCode || null;
      const fallbackCurrency = getCurrencyFromRegion(regionCode);
      formData.append("fallbackCurrency", fallbackCurrency);

      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/scan-receipt", baseUrl).href, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process receipt");
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const processedItems: ReceiptItemType[] = data.items.map(
          (item: any, index: number) => ({
            id: `item-${index}`,
            description: item.description || item.desc || "Item",
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            allocations: {},
          })
        );

        setItems(processedItems);
        setCurrency(data.currency || "USD");
        
        const itemsTotal = processedItems.reduce((sum, i) => sum + i.price, 0);
        const receiptServiceCharge = data.serviceCharge || 0;
        const receiptTip = data.tip || 0;
        
        // Use subTotal for bill splitting (the actual items total)
        // Service charge is tracked separately
        setBillTotal(itemsTotal);
        setServiceCharge(receiptServiceCharge + receiptTip);

        // Compare items total against subTotal (not grand total which includes service charge)
        const subTotal = data.subTotal || data.total || 0;
        if (subTotal && Math.abs(subTotal - itemsTotal) / subTotal > 0.05) {
          setWarning(
            "Total doesn't match items. Try a clearer photo."
          );
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("No items found in receipt");
      }
    } catch (error: any) {
      console.error("Receipt processing error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWarning(
        error.message || "Couldn't read receipt. Try better lighting or a flatter angle."
      );
      setImageUri(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setItems([]);
    setCurrency(null);
    setBillTotal(0);
    setServiceCharge(0);
    setSelectedQuantities({});
    setWarning(null);
  };

  const handleAddPerson = (name: string) => {
    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name,
      colorIndex: people.length % PersonColors.length,
    };
    setPeople([...people, newPerson]);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const handleAssign = (personId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const selectedQty = selectedQuantities[item.id] || 0;
        if (selectedQty > 0) {
          const currentAllocation = item.allocations[personId] || 0;
          return {
            ...item,
            allocations: {
              ...item.allocations,
              [personId]: currentAllocation + selectedQty,
            },
          };
        }
        return item;
      })
    );

    setSelectedQuantities({});
    setShowAssignment(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async () => {
    const summaryText = generateSummaryText();

    if (Platform.OS === "web") {
      await Clipboard.setStringAsync(summaryText);
      Alert.alert("Copied!", "Summary copied to clipboard");
    } else {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Clipboard.setStringAsync(summaryText);
        Alert.alert("Copied!", "Summary copied to clipboard. You can now paste and share it.");
      } else {
        await Clipboard.setStringAsync(summaryText);
        Alert.alert("Copied!", "Summary copied to clipboard");
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const generateSummaryText = () => {
    let text = `Dine Split Summary\n${"=".repeat(20)}\n\n`;
    text += `Bill Total: ${currencySymbol}${billTotal.toFixed(2)}\n`;
    text += `Tip: ${tipPercentage}%\n\n`;

    people.forEach((person) => {
      const personItems = items.filter((item) => item.allocations[person.id] > 0);
      let subtotal = 0;

      text += `${person.name}\n${"-".repeat(15)}\n`;
      personItems.forEach((item) => {
        const qty = item.allocations[person.id];
        const price = (item.price / item.quantity) * qty;
        subtotal += price;
        text += `  ${qty > 1 ? `${qty}x ` : ""}${item.description}: ${currencySymbol}${price.toFixed(2)}\n`;
      });

      const tip = subtotal * (tipPercentage / 100);
      const total = subtotal + tip;
      text += `  Subtotal: ${currencySymbol}${subtotal.toFixed(2)}\n`;
      text += `  Tip: ${currencySymbol}${tip.toFixed(2)}\n`;
      text += `  Total: ${currencySymbol}${total.toFixed(2)}\n\n`;
    });

    return text;
  };

  const assignButtonScale = useSharedValue(1);

  const assignButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: assignButtonScale.value }],
  }));

  const handleAssignButtonPressIn = () => {
    assignButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handleAssignButtonPressOut = () => {
    assignButtonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const canAssign = selectedCount > 0 && people.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: items.length > 0 ? 200 : Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ReceiptCapture
          imageUri={imageUri}
          currency={currency}
          total={billTotal}
          currencySymbol={currencySymbol}
          onCapture={handleCapture}
          onPickFromGallery={handlePickFromGallery}
          onRetake={handleRetake}
          isLoading={isLoading}
        />

        {warning ? (
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: theme.warning + "20" },
            ]}
          >
            <ThemedText style={[styles.warningIcon, { color: theme.warning }]}>⚠</ThemedText>
            <ThemedText
              style={[styles.warningText, { color: theme.warning }]}
            >
              {warning}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>People</ThemedText>
          </View>

          <Pressable
            onPress={() => setShowAddPerson(true)}
            style={[
              styles.addPersonButton,
              { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent },
            ]}
          >
            <ThemedText style={styles.addPersonIcon}>+</ThemedText>
            <ThemedText style={styles.addPersonText}>Add Person</ThemedText>
          </Pressable>

          {people.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peopleRow}
            >
              {people.map((person) => (
                <PersonChip
                  key={person.id}
                  person={person}
                  isSelected={filterPerson === person.id}
                  onPress={() =>
                    setFilterPerson(
                      filterPerson === person.id ? null : person.id
                    )
                  }
                  showTotal
                  total={personTotals[person.id] || 0}
                  currencySymbol={currencySymbol}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Items</ThemedText>
            {items.length > 0 ? (
              <ThemedText style={[styles.itemCount, { color: theme.textSecondary }]}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </ThemedText>
            ) : null}
          </View>

          {items.length > 0 ? (
            filteredItems.map((item) => (
              <ReceiptItem
                key={item.id}
                item={item}
                currencySymbol={currencySymbol}
                selectedQuantity={selectedQuantities[item.id] || 0}
                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                people={people}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyIcon, { color: theme.textTertiary }]}>📄</ThemedText>
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                Scan a receipt to get started
              </ThemedText>
            </View>
          )}
        </View>

        {items.length > 0 ? (
          <View style={styles.section}>
            <TipSelector
              tipPercentage={tipPercentage}
              onTipChange={setTipPercentage}
            />
          </View>
        ) : null}
      </ScrollView>

      {items.length > 0 ? (
        <View
          style={[
            styles.floatingSummaryContainer,
            { 
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          {selectedCount > 0 ? (
            <Animated.View
              entering={FadeInUp}
              exiting={FadeOutDown}
              style={styles.assignButtonWrapper}
            >
              <AnimatedPressable
                onPress={() =>
                  people.length > 0
                    ? setShowAssignment(true)
                    : Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Warning
                      )
                }
                onPressIn={handleAssignButtonPressIn}
                onPressOut={handleAssignButtonPressOut}
                disabled={!canAssign}
                style={[
                  styles.floatingButton,
                  {
                    backgroundColor: canAssign
                      ? theme.primary
                      : theme.backgroundSecondary,
                  },
                  assignButtonAnimatedStyle,
                ]}
              >
                <ThemedText
                  style={[
                    styles.floatingButtonText,
                    { color: canAssign ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {people.length === 0
                    ? "Add people above to assign items"
                    : `Assign ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`}
                </ThemedText>
              </AnimatedPressable>
            </Animated.View>
          ) : null}
          <SummaryPanel
            items={items}
            people={people}
            tipPercentage={tipPercentage}
            currencySymbol={currencySymbol}
            billTotal={billTotal}
            serviceCharge={serviceCharge}
          />
        </View>
      ) : null}

      <AddPersonModal
        visible={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onAdd={handleAddPerson}
      />

      <AssignmentModal
        visible={showAssignment}
        onClose={() => setShowAssignment(false)}
        onAssign={handleAssign}
        people={people}
        selectedCount={selectedCount}
        currencySymbol={currencySymbol}
        personTotals={personTotals}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  itemCount: {
    fontSize: 14,
  },
  addPersonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  addPersonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  addPersonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  peopleRow: {
    flexDirection: "row",
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  emptyIcon: {
    fontSize: 48,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  warningText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  warningIcon: {
    fontSize: 16,
  },
  assignButtonWrapper: {
    marginBottom: Spacing.md,
  },
  floatingButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  floatingSummaryContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
