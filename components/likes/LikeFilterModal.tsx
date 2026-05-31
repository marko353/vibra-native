import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
// Ako koristiš običan React Native CLI, zameni sa: import { BlurView } from "@react-native-community/blur";
import { BlurView } from "expo-blur"; 
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  primary: "#FF7F00",             // Vibra prepoznatljiva narandžasta
  white: "#FFFFFF",
  textPrimary: "#0F172A",         // Premium tamni tekst za kontrast na staklu
  textSecondary: "#475569",       
  cardBg: "rgba(255, 255, 255, 0.45)",     // Ultra prozirne svetle kartice koje propuštaju home screen pozadinu
  cardBorder: "rgba(255, 255, 255, 0.4)",  // Efekat staklene ivice (Frosty glass)
  sliderInactive: "rgba(15, 23, 42, 0.1)",
  // Veoma nežan tint koji ne skriva sliku ispod, već je samo priprema za blur
  backdropTint: "rgba(255, 255, 255, 0.2)", 
};

const GENDER_OPTIONS = [
  { label: "Women", value: "female" },
  { label: "Men", value: "male" },
  { label: "Everyone", value: "any" },
];

interface LikeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    ageRange: [number, number];
    distance: number;
    gender: string;
    withPhotos: boolean;
  }) => void;
  initialFilters?: {
    ageRange?: [number, number];
    distance?: number;
    gender?: string;
    withPhotos?: boolean;
  };
}

export default function LikeFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: LikeFilterModalProps) {
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 45]);
  const [distance, setDistance] = useState(50);
  const [gender, setGender] = useState("any");
  const [withPhotos, setWithPhotos] = useState(false);
  
  const { width: screenWidth } = useWindowDimensions();
  const [sliderWidth, setSliderWidth] = useState(screenWidth - 80);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && initialFilters) {
      if (initialFilters.ageRange?.length === 2) {
        setAgeRange(initialFilters.ageRange as [number, number]);
      }
      setDistance(initialFilters.distance ?? 50);
      setGender(initialFilters.gender ?? "any");
      setWithPhotos(initialFilters.withPhotos ?? false);
    }
  }, [visible, initialFilters]);

  const handleReset = () => {
    setAgeRange([18, 45]);
    setDistance(50);
    setGender("any");
    setWithPhotos(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Ceo kontejner modala pretvaramo u živu zamućenu površinu */}
      <BlurView 
        intensity={35} // Jačina zamućenja (savršeno balansirano da se naslućuje profil iza)
        tint="light" 
        style={styles.absoluteBlur}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropOverlay}>
            <TouchableWithoutFeedback>
              
              {/* Donji panel koji izranja iz dna ekrana */}
              <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                
                {/* Handlebar na vrhu */}
                <View style={styles.handleRow}>
                  <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Filters</Text>
                  <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
                    <Text style={styles.resetText}>Reset</Text>
                  </TouchableOpacity>
                </View>

                {/* PANEL 1: Age & Distance */}
                <View 
                  style={styles.glassCard}
                  onLayout={(e) => {
                    const { width } = e.nativeEvent.layout;
                    setSliderWidth(width - 40); 
                  }}
                >
                  {/* Age Section */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Age Range</Text>
                      <Text style={styles.valueText}>{ageRange[0]} – {ageRange[1]}</Text>
                    </View>
                    <View style={styles.sliderWrap}>
                      <MultiSlider
                        values={ageRange}
                        min={18}
                        max={70}
                        step={1}
                        sliderLength={sliderWidth}
                        onValuesChange={(values) => setAgeRange([values[0], values[1]])}
                        selectedStyle={{ backgroundColor: COLORS.primary, height: 4 }}
                        unselectedStyle={{ backgroundColor: COLORS.sliderInactive, height: 4 }}
                        trackStyle={{ height: 4, borderRadius: 2 }}
                        markerStyle={styles.premiumThumb}
                        pressedMarkerStyle={styles.premiumThumbPressed}
                      />
                    </View>
                  </View>

                  <View style={styles.innerDivider} />

                  {/* Distance Section */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Maximum Distance</Text>
                      <Text style={styles.valueText}>{distance} km</Text>
                    </View>
                    <View style={styles.sliderWrap}>
                      <MultiSlider
                        values={[distance]}
                        min={2}
                        max={150}
                        step={1}
                        sliderLength={sliderWidth}
                        onValuesChange={(values) => setDistance(values[0])}
                        selectedStyle={{ backgroundColor: COLORS.primary, height: 4 }}
                        unselectedStyle={{ backgroundColor: COLORS.sliderInactive, height: 4 }}
                        trackStyle={{ height: 4, borderRadius: 2 }}
                        markerStyle={styles.premiumThumb}
                        pressedMarkerStyle={styles.premiumThumbPressed}
                      />
                    </View>
                  </View>
                </View>

                {/* PANEL 2: Gender Segmented */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardLabel}>Show Me</Text>
                  <View style={styles.segmentedControl}>
                    {GENDER_OPTIONS.map((opt) => {
                      const isActive = gender === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setGender(opt.value)}
                          activeOpacity={1}
                          style={[styles.segment, isActive && styles.segmentActive]}
                        >
                          <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* PANEL 3: Toggle Switch */}
                <View style={styles.glassCardRow}>
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Verified Profiles Only</Text>
                    <Text style={styles.toggleSub}>Show only users with a verified profile photo</Text>
                  </View>
                  <Switch
                    value={withPhotos}
                    onValueChange={setWithPhotos}
                    trackColor={{ false: "rgba(15, 23, 42, 0.08)", true: COLORS.primary }}
                    thumbColor={COLORS.white}
                    style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                  />
                </View>

                {/* Main Action CTA */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => onApply({ ageRange, distance, gender, withPhotos })}
                    activeOpacity={0.88}
                    style={styles.applyBtn}
                  >
                    <Text style={styles.applyText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  absoluteBlur: {
    flex: 1,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdropTint,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)", // Sam panel je blago proziran dajući ultra-premium ton
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    paddingTop: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 15,
  },
  handleRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(15, 23, 42, 0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  closeBtn: {
    width: 80,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  resetBtn: {
    width: 80,
    alignItems: "flex-end",
  },
  resetText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Premium Frosted Glass Paneli
  glassCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingVertical: 4,
  },
  glassCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    marginHorizontal: 18,
    padding: 20,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  innerDivider: {
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    marginHorizontal: 20,
  },
  sliderWrap: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
  },
  
  // Narandžasti moderni klizač sa belim centrom
  premiumThumb: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 5,
    borderColor: COLORS.primary,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumThumbPressed: {
    height: 26,
    width: 26,
    borderRadius: 13,
    borderWidth: 7,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    borderRadius: 16,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 13,
  },
  segmentActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  footer: {
    paddingHorizontal: 18,
  },
  applyBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  applyText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});