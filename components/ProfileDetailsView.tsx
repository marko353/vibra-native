import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  primary: "#FF7F00",
  textPrimary: "#1a1a1a",
  textSecondary: "#999",
  textPlaceholder: "#C8C8C8",
  background: "#fff",
  border: "#ECECEC",
  iconBg: "#fff5ec",
  iconBorder: "#ffd0a8",
  pageBg: "#F4F5F7",
};

type IconNames = keyof typeof Ionicons.glyphMap;

interface UserProfileData {
  bio: string | null;
  jobTitle: string | null;
  education: string[] | null;
  location: {
    type?: string;
    coordinates?: [number, number];
    locationCity?: string;
    locationCountry?: string;
  } | null;
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

const getGenderLabel = (g: string | null | undefined) => {
  if (g === "male") return "Muški";
  if (g === "female") return "Ženski";
  if (g === "other") return "Ostali";
  return "";
};

// Red sa ikonom i vrednosti
const DataRow = ({
  icon,
  value,
  isLast = false,
}: {
  icon: IconNames;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.dataRow, isLast && styles.dataRowLast]}>
    <Ionicons name={icon} size={16} color={COLORS.primary} style={styles.dataIcon} />
    <Text style={styles.dataValue}>{value}</Text>
  </View>
);

// Tag pill
const Tag = ({ label }: { label: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

// Sekcija sa naslovom i karticom
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const ProfileDetailsView = ({ profile, locationCity }: ProfileDetailsViewProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const hasAnyData =
    profile.bio || profile.jobTitle ||
    (profile.education && profile.education.length > 0) ||
    profile.location?.locationCity || profile.height || profile.gender ||
    profile.sexualOrientation || profile.relationshipType || profile.horoscope ||
    profile.familyPlans || profile.communicationStyle || profile.loveStyle ||
    profile.pets || profile.drinks || profile.smokes || profile.workout ||
    profile.diet ||
    (profile.languages && profile.languages.length > 0) ||
    (profile.interests && profile.interests.length > 0);

  type RowDef = { icon: IconNames; value: string };

  const essentials: RowDef[] = [
    profile.height ? { icon: "body-outline", value: `${profile.height} cm` } : null,
    profile.gender ? { icon: "male-female-outline", value: getGenderLabel(profile.gender) } : null,
    profile.sexualOrientation ? { icon: "transgender-outline", value: profile.sexualOrientation } : null,
    profile.jobTitle ? { icon: "briefcase-outline", value: profile.jobTitle } : null,
    profile.education?.length ? { icon: "school-outline", value: profile.education!.join(", ") } : null,
    (profile.showLocation !== false && (locationCity || profile.location?.locationCity))
      ? { icon: "location-outline", value: locationCity || profile.location!.locationCity! }
      : null,
    profile.horoscope ? { icon: "planet-outline", value: profile.horoscope } : null,
  ].filter(Boolean) as RowDef[];

  const lifestyle: RowDef[] = [
    profile.workout ? { icon: "barbell-outline", value: profile.workout } : null,
    profile.diet ? { icon: "nutrition-outline", value: profile.diet } : null,
    profile.drinks ? { icon: "beer-outline", value: profile.drinks } : null,
    profile.smokes ? { icon: "bonfire-outline", value: profile.smokes } : null,
    profile.pets ? { icon: "paw-outline", value: profile.pets } : null,
  ].filter(Boolean) as RowDef[];

  const relationships: RowDef[] = [
    profile.relationshipType ? { icon: "heart-outline", value: profile.relationshipType } : null,
    profile.loveStyle ? { icon: "flower-outline", value: profile.loveStyle } : null,
    profile.familyPlans ? { icon: "people-outline", value: profile.familyPlans } : null,
    profile.communicationStyle ? { icon: "chatbubbles-outline", value: profile.communicationStyle } : null,
  ].filter(Boolean) as RowDef[];

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.scrollContent}>
        {hasAnyData ? (
          <>
            {/* Bio */}
            {profile.bio && (
              <Section title="O meni">
                <View style={styles.bioCard}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              </Section>
            )}

            {/* Essentials */}
            {essentials.length > 0 && (
              <Section title="Osnovne informacije">
                {essentials.map((row, i) => (
                  <DataRow
                    key={i}
                    icon={row.icon}
                    value={row.value}
                    isLast={i === essentials.length - 1}
                  />
                ))}
              </Section>
            )}

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <Section title="Interesovanja">
                <View style={styles.tagsCard}>
                  {profile.interests.map((t, i) => <Tag key={i} label={t} />)}
                </View>
              </Section>
            )}

            {/* Lifestyle */}
            {lifestyle.length > 0 && (
              <Section title="Životni stil">
                {lifestyle.map((row, i) => (
                  <DataRow
                    key={i}
                    icon={row.icon}
                    value={row.value}
                    isLast={i === lifestyle.length - 1}
                  />
                ))}
              </Section>
            )}

            {/* Relationships */}
            {relationships.length > 0 && (
              <Section title="Veze i stavovi">
                {relationships.map((row, i) => (
                  <DataRow
                    key={i}
                    icon={row.icon}
                    value={row.value}
                    isLast={i === relationships.length - 1}
                  />
                ))}
              </Section>
            )}

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <Section title="Jezici">
                <View style={styles.tagsCard}>
                  {profile.languages.map((l, i) => <Tag key={i} label={l} />)}
                </View>
              </Section>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Animated.Image
              source={require("../assets/images/1000006381.png")}
              style={[styles.logo, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={styles.emptyTitle}>Dobrodošao u VibrA!</Text>
            <Text style={styles.emptyText}>
              Popuni profil da bi drugi mogli da te vide i povežu se sa tobom.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Image
            source={require("../assets/images/1000006381.png")}
            style={styles.footerLogo}
          />
          <Text style={styles.footerText}>VibrA</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: COLORS.pageBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },

  // ── Section ───────────────────────────────────────────────
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  // ── Data row ──────────────────────────────────────────────
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  dataRowLast: { borderBottomWidth: 0 },
  dataIcon: { width: 20, textAlign: "center" },
  dataValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "500",
    flex: 1,
  },

  // ── Bio ───────────────────────────────────────────────────
  bioCard: {
    padding: 16,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontWeight: "400",
  },

  // ── Tags ─────────────────────────────────────────────────
  tagsCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.iconBg,
    borderWidth: 1,
    borderColor: COLORS.iconBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // ── Empty ─────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 36,
    alignItems: "center",
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  logo: { width: 72, height: 72, marginBottom: 16, opacity: 0.85 },
  emptyTitle: { fontSize: 19, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 21 },

  // ── Footer ────────────────────────────────────────────────
  footer: { alignItems: "center", marginTop: 8, paddingBottom: 10 },
  footerDivider: { width: 36, height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  footerLogo: { width: 24, height: 24, opacity: 0.2, marginBottom: 4 },
  footerText: { fontSize: 10, color: COLORS.textPlaceholder, letterSpacing: 2, fontWeight: "600", textTransform: "uppercase" },
});

export default ProfileDetailsView;