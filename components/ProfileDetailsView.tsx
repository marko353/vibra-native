import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#E91E63",
  secondary: "#FFC107",
  accent: "#2196F3",
  textPrimary: "#1E1E1E",
  textSecondary: "#666666",
  background: "#F0F2F5",
  cardBackground: "#FFFFFF",
  placeholder: "#A0A0A0",
  border: "#E0E0E0",
  lightGray: "#D3D3D3",
  white: "#FFFFFF",
};

type IconNames = keyof typeof Ionicons.glyphMap;

interface UserProfileData {
  bio: string | null;
  jobTitle: string | null;
  education: string[] | null;
  location: { latitude?: number; longitude?: number; locationCity?: string; locationCountry?: string } | null;
  showLocation?: boolean;
  gender: string | null;
  sexualOrientation: string | null;
  relationshipType: string | null;
  horoscope: string | null;
  familyPlans: string | null;
  communicationStyle: string | null;
  loveStyle: string | null;
  pets: string | null;
  drinks: string | null;
  smokes: string | null;
  workout: string | null;
  diet: string | null;
  height: number | null;
  languages: string[];
  interests: string[];
}

interface ProfileDetailsViewProps {
  profile: UserProfileData;
  locationCity: string | null;
}

const ProfileDetailsView = ({ profile, locationCity }: ProfileDetailsViewProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const renderInfoRow = (iconName: IconNames, title: string, value: any) => {
    if (title === "Živi u") {
      const displayLocation = locationCity;
      if (profile.showLocation === false || !displayLocation) return null;
      value = displayLocation;
    }
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    let displayValue = value;
    if (Array.isArray(value)) displayValue = value.join(", ");
    else if (title === "Visina") displayValue = `${value} cm`;

    return (
      <View style={styles.infoRow} key={title}>
        <Ionicons name={iconName} size={20} color={COLORS.textSecondary} style={styles.infoIcon} />
        <View style={styles.textContainer}>
          <Text style={styles.infoTitle}>{title}:</Text>
          <Text style={styles.infoValue}>{displayValue}</Text>
        </View>
      </View>
    );
  };

  const renderTagSection = (title: string, tags: string[]) => {
    if (!tags || tags.length === 0) return null;
    return (
      <View style={styles.sectionCard} key={title}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const hasAnyData =
    profile.bio ||
    profile.jobTitle ||
    (profile.education && profile.education.length > 0) ||
    profile.location?.locationCity ||
    profile.height ||
    profile.gender ||
    profile.sexualOrientation ||
    profile.relationshipType ||
    profile.horoscope ||
    profile.familyPlans ||
    profile.communicationStyle ||
    profile.loveStyle ||
    profile.pets ||
    profile.drinks ||
    profile.smokes ||
    profile.workout ||
    profile.diet ||
    (profile.languages && profile.languages.length > 0) ||
    (profile.interests && profile.interests.length > 0);

  // Kreiranje redova za osnovne informacije
  const basicInfoData = [
    { icon: "briefcase-outline", title: "Posao", value: profile.jobTitle },
    { icon: "school-outline", title: "Obrazovanje", value: profile.education },
    { icon: "location-outline", title: "Živi u", value: profile.location?.locationCity },
    { icon: "resize-outline", title: "Visina", value: profile.height },
    { icon: "person-outline", title: "Pol", value: profile.gender },
    { icon: "transgender-outline", title: "Seksualna orijentacija", value: profile.sexualOrientation },
  ];
  const basicInfoRows = basicInfoData.map(item => renderInfoRow(item.icon as IconNames, item.title, item.value)).filter(Boolean);

  const lifestyleData = [
    { icon: "paw-outline", title: "Ljubimci", value: profile.pets },
    { icon: "beer-outline", title: "Piće", value: profile.drinks },
    { icon: "bonfire-outline", title: "Puši", value: profile.smokes },
    { icon: "barbell-outline", title: "Vežbanje", value: profile.workout },
    { icon: "nutrition-outline", title: "Ishrana", value: profile.diet },
  ];
  const lifestyleRows = lifestyleData.map(item => renderInfoRow(item.icon as IconNames, item.title, item.value)).filter(Boolean);

  const personalityData = [
    { icon: "heart-outline", title: "Tip veze", value: profile.relationshipType },
    { icon: "star-outline", title: "Horoskop", value: profile.horoscope },
    { icon: "people-outline", title: "Porodični planovi", value: profile.familyPlans },
    { icon: "chatbox-outline", title: "Stil komunikacije", value: profile.communicationStyle },
    { icon: "heart-outline", title: "Ljubavni stil", value: profile.loveStyle },
  ];
  const personalityRows = personalityData.map(item => renderInfoRow(item.icon as IconNames, item.title, item.value)).filter(Boolean);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {hasAnyData ? (
          <>
            {profile.bio && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>O meni</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            {basicInfoRows.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Osnovne informacije</Text>
                {basicInfoRows}
              </View>
            )}

            {lifestyleRows.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Životni stil</Text>
                {lifestyleRows}
              </View>
            )}

            {personalityRows.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Osobine i stavovi</Text>
                {personalityRows}
              </View>
            )}

            {renderTagSection("Jezici", profile.languages)}
            {renderTagSection("Interesovanja", profile.interests)}
          </>
        ) : (
          <View style={styles.placeholderCard}>
            <Animated.Image
              source={require("../assets/images/1000006381.png")}
              style={[styles.logo, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={styles.placeholderTitle}>Dobrodošao u VibrA!</Text>
            <Text style={styles.placeholderText}>
              Popuni svoj profil da bi drugi mogli da te vide i povežu se sa tobom.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Image source={require("../assets/images/1000006381.png")} style={styles.footerLogo} />
        <Text style={styles.footerText}>VibrA • Aplikacija za upoznavanje i povezivanje</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 80 },
  container: { flex: 1 },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 10 },
  bioText: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  infoIcon: { marginRight: 10 },
  textContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  infoTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginRight: 5 },
  infoValue: { fontSize: 16, color: COLORS.textSecondary, flexShrink: 1 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  tag: { backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, marginBottom: 10 },
  tagText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  placeholderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  placeholderTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 10, textAlign: "center" },
  placeholderText: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
  footer: { alignItems: "center", marginTop: 30 },
  footerLogo: { width: 40, height: 40, marginBottom: 5 },
  footerText: { fontSize: 12, color: COLORS.textSecondary },
});

export default ProfileDetailsView;
