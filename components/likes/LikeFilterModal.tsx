import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#E91E63",
  accent: "#007AFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  background: "#FAFAFA",
  divider: "#E0E0E0",
  border: "#E0E0E0",
  disabled: "#F3B6C4",
  thumb: "#FFFFFF",
  thumbBorder: "#E91E63",
  sliderInactive: "#E5E5E5",
};

const GENDER_OPTIONS = [
  { label: "Žene", value: "female" },
  { label: "Muškarci", value: "male" },
  { label: "Svi", value: "any" },
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
  const [ageRange, setAgeRange] = useState<[number, number]>(
    initialFilters?.ageRange && initialFilters.ageRange.length === 2
      ? initialFilters.ageRange
      : [18, 99]
  );
  const [distance, setDistance] = useState(initialFilters?.distance || 50);
  const [gender, setGender] = useState(initialFilters?.gender || "any");
  const [withPhotos, setWithPhotos] = useState(
    initialFilters?.withPhotos || false
  );
  const [isLoading, setIsLoading] = useState(false);

  // Animation for modal slide up
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.ageRange && initialFilters.ageRange.length === 2) {
        setAgeRange(initialFilters.ageRange as [number, number]);
      } else {
        setAgeRange([18, 99]);
      }
      setDistance(initialFilters.distance ?? 50);
      setGender(initialFilters.gender ?? "any");
      setWithPhotos(initialFilters.withPhotos || false);
    }
  }, [initialFilters]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const handleApply = () => {
    setIsLoading(true);
    onApply({ ageRange, distance, gender, withPhotos });
    setIsLoading(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.animatedModal,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            {/* Header */}
            <View style={styles.headerFlat}>
              <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                <Ionicons
                  name="arrow-back"
                  size={28}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitleFlat}>Podešavanja pretrage</Text>
              <View style={{ width: 36 }} />
            </View>
            {/* Starosni raspon */}
            <View style={styles.sectionFlat}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitleFlat}>Starosni raspon</Text>
                <Text style={styles.valueTextFlat}>
                  {ageRange[0]} – {ageRange[1]}
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={ageRange}
                  min={18}
                  max={99}
                  step={1}
                  sliderLength={260}
                  onValuesChange={(values: number[]) => {
                    if (values.length === 2)
                      setAgeRange([values[0], values[1]]);
                  }}
                  selectedStyle={{ backgroundColor: COLORS.primary }}
                  unselectedStyle={{ backgroundColor: COLORS.sliderInactive }}
                  markerStyle={styles.sliderThumbFlat}
                />
              </View>
            </View>
            <View style={styles.divider} />
            {/* Udaljenost */}
            <View style={styles.sectionFlat}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitleFlat}>Udaljenost</Text>
                <Text style={styles.valueTextFlat}>{distance} km</Text>
              </View>
              <View style={styles.sliderContainer}>
                <MultiSlider
                  values={[distance]}
                  min={1}
                  max={200}
                  step={1}
                  sliderLength={260}
                  onValuesChange={(values: number[]) => {
                    if (values.length === 1) setDistance(values[0]);
                  }}
                  selectedStyle={{ backgroundColor: COLORS.primary }}
                  unselectedStyle={{ backgroundColor: COLORS.sliderInactive }}
                  markerStyle={styles.sliderThumbFlat}
                  allowOverlap={false}
                  snapped
                />
              </View>
            </View>
            <View style={styles.divider} />
            {/* Interesuju te */}
            <View style={styles.sectionFlat}>
              <Text style={styles.sectionTitleFlat}>Interesuju te</Text>
              <View style={styles.segmentRowFlat}>
                {GENDER_OPTIONS.map((opt) => {
                  let iconName:
                    | "female-outline"
                    | "male-outline"
                    | "people-outline";
                  if (opt.value === "female") iconName = "female-outline";
                  else if (opt.value === "male") iconName = "male-outline";
                  else iconName = "people-outline";
                  const isActive = gender === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.segmentBtnFlat,
                        isActive && styles.segmentBtnFlatActive,
                      ]}
                      onPress={() => setGender(opt.value)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={iconName}
                        size={22}
                        color={isActive ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginBottom: 2 }}
                      />
                      <Text
                        style={[
                          styles.segmentTextFlat,
                          isActive && styles.segmentTextFlatActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.divider} />
            {/* Samo sa fotografijama */}
            <View style={styles.sectionFlat}>
              <View style={styles.toggleRowFlat}>
                <Text style={styles.toggleLabelFlat}>
                  Samo sa fotografijama
                </Text>
                <Switch
                  value={withPhotos}
                  onValueChange={setWithPhotos}
                  trackColor={{
                    false: COLORS.sliderInactive,
                    true: COLORS.primary,
                  }}
                  thumbColor={withPhotos ? COLORS.primary : COLORS.thumb}
                />
              </View>
            </View>
            {/* Dugme Primeni */}
            <View style={styles.applyContainerFlat}>
              <TouchableOpacity
                style={[
                  styles.applyBtnFlat,
                  isLoading && styles.applyBtnDisabledFlat,
                ]}
                onPress={handleApply}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.applyTextFlat}>Primeni</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 520,
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
  },
  headerFlat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 0,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerBtn: {
    padding: 8,
    width: 36,
    alignItems: "flex-start",
  },
  headerTitleFlat: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    flex: 1,
  },
  sectionFlat: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  sectionTitleFlat: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 0,
  },
  valueTextFlat: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderContainer: {
    marginTop: 8,
    marginBottom: 0,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  sliderThumbFlat: {
    height: 26,
    width: 26,
    borderRadius: 13,
    backgroundColor: COLORS.thumb,
    borderWidth: 2,
    borderColor: COLORS.thumbBorder,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: 16,
    opacity: 0.7,
  },
  segmentRowFlat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 2,
    gap: 14,
  },
  segmentBtnFlat: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    marginHorizontal: 2,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 0,
    minWidth: 0,
    minHeight: 36,
  },
  segmentBtnFlatActive: {
    backgroundColor: "#FCE4EC",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  segmentTextFlat: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 15,
    marginTop: 2,
  },
  segmentTextFlatActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  toggleRowFlat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
  },
  toggleLabelFlat: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  applyContainerFlat: {
    width: "100%",
    backgroundColor: COLORS.background,
    paddingHorizontal: 36,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnFlat: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  applyBtnDisabledFlat: {
    backgroundColor: COLORS.disabled,
  },
  applyTextFlat: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  animatedModal: {
    width: "100%",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
