import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplitScreen from "@/screens/SplitScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

export type RootStackParamList = {
  Split: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderTitle() {
  const { theme } = useTheme();

  return (
    <View style={styles.headerTitle}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.headerIcon}
        resizeMode="contain"
      />
      <ThemedText style={[styles.headerText, { color: theme.text }]}>
        Dine Split
      </ThemedText>
    </View>
  );
}

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Split"
        component={SplitScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerButton: {
    padding: Spacing.xs,
  },
  iconText: {
    fontSize: 22,
  },
});
