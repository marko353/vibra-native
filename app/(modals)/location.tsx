import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthContext } from "../../context/AuthContext";
import { useProfileContext } from "../../context/ProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModalDragHandle, ModalHeader, modalStyles } from "../../components/ModalTemplate";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const COLORS = {
  primary: "#ff7f00",
  textPrimary: "#1a1a1a",
  textSecondary: "#999",
  border: "#ECECEC",
  selectedBg: "#fff5ec",
  selectedBorder: "#ffd0a8",
  iconBg: "#fff5ec",
  cardBg: "#fff",
};

export default function LocationSettingsModal() {
  const router = useRouter();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { profile } = useProfileContext();
  const insets = useSafeAreaInsets();

  const [isLocationEnabled, setIsLocationEnabled] = useState(
    profile?.showLocation ?? false
  );
  const [isLoading, setIsLoading] = useState(false);

  const hasChanges = isLocationEnabled !== (profile?.showLocation ?? false);

  const mutation = useMutation({
    mutationFn: async (data: Partial<{ location: object | null; showLocation: boolean }>) => {
      if (!user?.token) throw new Error("Not authenticated");
      const response = await axios.put(
        `${API_BASE_URL}/api/user/update-profile`,
        data,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    },
    onSuccess: (updatedProfileData) => {
      queryClient.setQueryData(["userProfile", user?.id], (old: any) => ({
        ...old,
        ...updatedProfileData,
      }));
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to save location settings.");
      setIsLocationEnabled(profile?.showLocation ?? false);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const openAppSettings = () => {
    if (Platform.OS === "ios") Linking.openURL("app-settings:");
    else Linking.openSettings();
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsLoading(true);

    if (isLocationEnabled) {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          status = (await Location.requestForegroundPermissionsAsync()).status;
        }
        if (status !== "granted") throw new Error("Permission denied");

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const geocode = await Location.reverseGeocodeAsync(location.coords);
        const locationCity = geocode[0]?.subregion || geocode[0]?.city || null;

        mutation.mutate({
          location: {
            type: "Point",
            coordinates: [location.coords.longitude, location.coords.latitude],
            locationCity,
          },
          showLocation: true,
        });
      } catch (error: any) {
        setIsLoading(false);
        setIsLocationEnabled(false);

        if (error.message === "Permission denied") {
          Alert.alert(
            "Permission required",
            "Please enable location access in your phone settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open settings", onPress: openAppSettings },
            ]
          );
        } else {
          Alert.alert("Error", "Unable to retrieve your location.");
        }
      }
    } else {
      mutation.mutate({ showLocation: false });
    }
  };

  return (
    <View style={[modalStyles.container, { paddingBottom: insets.bottom || 16 }]}>
      <ModalDragHandle />
      <ModalHeader
        title="Location"
        onClose={() => router.back()}
        onSave={handleSave}
        hasChanges={hasChanges}
        isPending={isLoading || mutation.isPending}
      />

      <View style={styles.content}>
        <Text style={styles.subtitle}>Control how your location appears on your profile.</Text>

        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="location-sharp" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Show my location</Text>
            <Text style={styles.cardDescription}>
              When enabled, your city will be visible on your profile.
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#E8E8E8", true: COLORS.selectedBorder }}
            thumbColor={isLocationEnabled ? COLORS.primary : "#fff"}
            ios_backgroundColor="#E8E8E8"
            onValueChange={setIsLocationEnabled}
            value={isLocationEnabled}
            disabled={isLoading || mutation.isPending}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});