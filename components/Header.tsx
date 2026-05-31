import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderProps {
  withShadow?: boolean;
  onFilterClick?: () => void;
}

export default function Header({ withShadow, onFilterClick }: HeaderProps) {
  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, withShadow && styles.shadow]}
    >
      <View style={styles.logoWrapper}>
        <Image
          source={require("../assets/images/1000006380.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo"
        />
      </View>

      <View style={styles.buttons}>
        {onFilterClick && (
          <TouchableOpacity
            onPress={onFilterClick}
            accessibilityLabel="Filter"
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={20}
              color="#1C1C1E"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => console.log("Premium")}
          accessibilityLabel="Premium"
          style={styles.premiumButton}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={20}
            color="#FF6A00"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    height: 84,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoWrapper: {
    height: '100%',
    justifyContent: 'center',
  },
  logo: {
    width: 110,
    height: 80,
    marginVertical: -20,
    transform: [{ scale: 1.05 }],
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#EBEBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF3EC',
    borderWidth: 1,
    borderColor: '#FFD0A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});