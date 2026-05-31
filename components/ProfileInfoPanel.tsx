import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthContext } from "../context/AuthContext";
import { UserProfile } from "../context/ProfileContext";
import ProfileCarousel from "./ProfileCarousel";
import ProfileDetailsView from "./ProfileDetailsView";

const { height: H } = Dimensions.get("window");
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const C = {
  primary:   "#FF7F00",
  nope:      "#EF4444",
  superLike: "#8B5CF6",
  white:     "#FFFFFF",
  border:    "#ECECEC",
  darkBg:    "#0B0B0F",
};

// ─── Age helper ───────────────────────────────────────────────────────────────
const calcAge = (bd?: string | null) => {
  if (!bd) return null;
  const b = new Date(bd);
  if (isNaN(b.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProfileInfoPanelProps {
  user: UserProfile | null;
  isVisible: boolean;
  onClose: () => void;
  onLike: () => void;
  onNope: () => void;
  onSuperLike?: () => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProfileInfoPanel: React.FC<ProfileInfoPanelProps> = ({
  user, isVisible, onClose, onLike, onNope, onSuperLike,
}) => {
  const { user: authUser } = useAuthContext();
  const slide = useRef(new Animated.Value(H)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  // Button press scale animations
  const nopeScale      = useRef(new Animated.Value(1)).current;
  const superLikeScale = useRef(new Animated.Value(1)).current;
  const likeScale      = useRef(new Animated.Value(1)).current;

  // Fetch full profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profilePanel", user?._id],
    queryFn: async () => {
      if (!user?._id || !authUser?.token) return user;
      try {
        const r = await axios.get(`${API_BASE_URL}/api/user/${user._id}`, {
          headers: { Authorization: `Bearer ${authUser.token}` },
        });
        return r.data as UserProfile;
      } catch { return user; }
    },
    enabled: isVisible && !!user?._id,
  });

  // Slide in / out
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: H, duration: 280, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  const data   = profile || user;
  const images = (data?.profilePictures?.filter(Boolean) as string[]) ?? [];
  const age    = calcAge(data?.birthDate);

  // Map UserProfile → UserProfileData (what ProfileDetailsView expects)
  const profileData = {
    bio:                data?.bio ?? null,
    jobTitle:           data?.jobTitle ?? null,
    education:          data?.education ?? [],
    location:           data?.location ?? null,
    showLocation:       data?.showLocation,
    gender:             data?.gender ?? null,
    sexualOrientation:  data?.sexualOrientation ?? null,
    relationshipType:   data?.relationshipType ?? null,
    horoscope:          data?.horoscope ?? null,
    familyPlans:        data?.familyPlans ?? null,
    communicationStyle: data?.communicationStyle ?? null,
    loveStyle:          data?.loveStyle ?? null,
    pets:               data?.pets ?? null,
    drinks:             data?.drinks ?? null,
    smokes:             data?.smokes ?? null,
    workout:            data?.workout ?? null,
    diet:               data?.diet ?? null,
    height:             data?.height ?? null,
    languages:          data?.languages ?? [],
    interests:          data?.interests ?? [],
  };

  const locationCity = data?.location?.locationCity ?? null;

  // Spring press animation
  const pressBtn = (scale: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.86, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    cb();
  };

  return (
    <Animated.View
      style={[s.overlay, { opacity: fade }]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {/* Tap backdrop to close */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, { transform: [{ translateY: slide }] }]}>

        {/* ── TOP BAR (close + options) ── */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.navBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color={C.white} />
          </TouchableOpacity>

        </View>

        {/* ── SCROLLABLE CONTENT ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* ProfileCarousel — same as Profile tab */}
          <ProfileCarousel
            images={images}
            fullName={data?.fullName}
            age={age}
            locationCity={locationCity ?? undefined}
            showLocation={data?.showLocation}
          />

          {/* ProfileDetailsView — same as Profile tab */}
          {!isLoading && (
            <ProfileDetailsView
              profile={profileData}
              locationCity={locationCity}
            />
          )}

          {/* Skeleton while loading */}
          {isLoading && (
            <View style={{ padding: 20, gap: 12 }}>
              {[80, 64, 64, 80].map((h, i) => (
                <View key={i} style={[s.skeleton, { height: h }]} />
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── FLOATING FOOTER BUTTONS ── */}
        <View style={s.footer} pointerEvents="box-none">
          {/* NOPE */}
          <Animated.View style={{ transform: [{ scale: nopeScale }] }}>
            <TouchableOpacity
              style={[s.actionBtn, s.btnNope]}
              activeOpacity={0.85}
              onPress={() => pressBtn(nopeScale, () => { onNope(); onClose(); })}
            >
              <Ionicons name="close" size={28} color={C.nope} />
            </TouchableOpacity>
          </Animated.View>

          {/* SUPER LIKE */}
          <Animated.View style={{ transform: [{ scale: superLikeScale }] }}>
            <TouchableOpacity
              style={[s.actionBtn, s.btnSuperLike]}
              activeOpacity={0.85}
              onPress={() => pressBtn(superLikeScale, () => { onSuperLike?.(); onClose(); })}
            >
              <Ionicons name="star" size={22} color={C.superLike} />
            </TouchableOpacity>
          </Animated.View>

          {/* LIKE */}
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity
              style={[s.actionBtn, s.btnLike]}
              activeOpacity={0.85}
              onPress={() => pressBtn(likeScale, () => { onLike(); onClose(); })}
            >
              <Ionicons name="heart" size={26} color={C.white} />
            </TouchableOpacity>
          </Animated.View>
        </View>

      </Animated.View>
    </Animated.View>
  );
};

export default ProfileInfoPanel;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    zIndex: 999,
    elevation: 999,
  },
  sheet: {
    height: H * 0.94,
    backgroundColor: C.darkBg, // matches ProfileCarousel dark bg
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  // top bar floats over carousel
  topBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // skeleton
  skeleton: {
    backgroundColor: "#1e1e24",
    borderRadius: 16,
  },

  // footer — floating, no background
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 14,
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  btnNope: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.5)",
  },
  btnSuperLike: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.5)",
  },
  btnLike: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
});