import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BenefitMarquee from "../../components/BenefitMarquee";
import Header from "../../components/Header";
import MonetizationPackages from "../../components/MonetizationPackages";
import { useAuthContext } from "../../context/AuthContext";
import { useFilterModal } from "../../context/FilterModalContext";
import { useProfileContext } from "../../context/ProfileContext";

const calculateAge = (birthDateString?: string | null): number | null => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const calculateCompletion = (profile: NonNullable<ReturnType<typeof useProfileContext>["profile"]>): number => {
  const fields: boolean[] = [
    !!profile.fullName,
    (profile.profilePictures?.length ?? 0) > 0,
    !!profile.bio,
    !!profile.jobTitle,
    !!profile.height,
    !!profile.horoscope,
    !!profile.workout,
    !!profile.diet,
    !!profile.relationshipType,
    (profile.interests?.length ?? 0) > 0,
    (profile.languages?.length ?? 0) > 0,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

const COLORS = {
  primary: "#ff7f00",
  background: "#F4F5F7",
  card: "#FFFFFF",
  textPrimary: "#1a1a1a",
  textSecondary: "#999",
  textPlaceholder: "#C8C8C8",
  border: "#ECECEC",
  iconBg: "#fff5ec",
  iconBorder: "#ffd0a8",
};

export default function ProfileScreen() {
  const { showModal } = useFilterModal();
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, isLoading: isProfileLoading } = useProfileContext();
  const insets = useSafeAreaInsets();

  // Prikazujemo loader samo pri prvom učitavanju, ne pri svakom fokusu
  if (isProfileLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() =>
            queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] })
          }
        >
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = calculateAge(profile.birthDate);
  const avatarSource =
    profile.profilePictures?.[0] ? { uri: profile.profilePictures[0] } : null;
  const completion = calculateCompletion(profile);

  return (
    <View style={styles.container}>
      <Header onFilterClick={showModal} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* ── HERO CARD ─────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarContainer}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Ionicons name="person-outline" size={32} color={COLORS.textPlaceholder} />
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile.fullName}
                {age !== null && <Text style={styles.heroAge}>, {age}</Text>}
              </Text>
              <View style={styles.premiumBadge}>
                <Ionicons name="flash" size={11} color={COLORS.primary} />
                <Text style={styles.premiumBadgeText}>VibrA Premium</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.completionRow}>
            <View style={styles.completionInfo}>
              <Text style={styles.completionLabel}>Profile completion</Text>
              <Text style={styles.completionValue}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` as any }]} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/profile/editProfile")}
            activeOpacity={0.8}
          >
            <AntDesign name="edit" size={15} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <MonetizationPackages />
        <View style={{ marginHorizontal: -20 }}>
          <BenefitMarquee />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  errorText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  retryBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  avatarContainer: { position: "relative" },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: COLORS.iconBorder },
  avatarEmpty: { backgroundColor: COLORS.iconBg, alignItems: "center", justifyContent: "center" },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: -0.5 },
  heroAge: { fontWeight: "300", color: COLORS.textSecondary },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: COLORS.iconBg, borderWidth: 1, borderColor: COLORS.iconBorder, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  premiumBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  completionRow: { marginBottom: 16, gap: 8 },
  completionInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  completionLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  completionValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: 14, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  editBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
});