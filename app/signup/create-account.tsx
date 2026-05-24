import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuthContext } from "../../context/AuthContext";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const GENDERS = [
  { label: "Man", value: "male", icon: "♂" },
  { label: "Woman", value: "female", icon: "♀" },
  { label: "Other", value: "other", icon: "⚧" },
];

export default function CreateAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser } = useAuthContext();

  const safeParam = (p: string | string[] | undefined) =>
    Array.isArray(p) ? p[0] : p || "";

  const day = safeParam(params.day);
  const month = safeParam(params.month);
  const year = safeParam(params.year);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [agree, setAgree] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const nameFocus = useRef(new Animated.Value(0)).current;
  const emailFocus = useRef(new Animated.Value(0)).current;
  const passFocus = useRef(new Animated.Value(0)).current;
  const confFocus = useRef(new Animated.Value(0)).current;

  const genderScales = useRef(
    GENDERS.reduce((acc, g) => ({ ...acc, [g.value]: new Animated.Value(1) }), {} as Record<string, Animated.Value>)
  ).current;

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confRef = useRef<TextInput>(null);

  const API_BASE_URL =
    (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_BASE_URL ||
    "http://192.168.1.6:5000";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleGenderSelect = (value: string) => {
    if (gender && gender !== value) {
      Animated.spring(genderScales[gender], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    }
    setGender(value);
    Animated.spring(genderScales[value], {
      toValue: 1.03,
      useNativeDriver: true,
      tension: 300,
      friction: 15,
    }).start();
  };

  const getBorderColor = (anim: Animated.Value, hasError: boolean) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? "#d00000" : "#ECECEC", "#ff7f00"],
    });

  const getShadowOpacity = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] });

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.includes("@")) newErrors.email = "Enter a valid email";
    if (pass.length < 6) newErrors.pass = "Password must be at least 6 characters";
    if (pass !== confPass) newErrors.conf = "Passwords do not match";
    if (!gender) newErrors.gender = "Please select your gender";
    if (!agree) newErrors.agree = "You must agree to continue";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      const username = email.split("@")[0];
      const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        username,
        email,
        password: pass,
        fullName: name,
        birthDate,
        gender,
      });

      const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password: pass,
      });

      const userData = {
        id: loginRes.data.id,
        fullName: loginRes.data.fullName,
        email: loginRes.data.email,
        token: loginRes.data.token,
      };

      setUser(userData);
      await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
      await AsyncStorage.setItem("token", userData.token);

      router.replace("/profile/editProfile");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      setErrors((prev) => ({ ...prev, _server: message }));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && email && pass && confPass && gender && agree;

  const monthIdx = parseInt(month, 10) - 1;
  const validMonthName = !isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 ? monthNames[monthIdx] : "";
  const dobDisplay = day && validMonthName && year ? `${parseInt(day, 10)} ${validMonthName} ${year}` : "Not set";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AntDesign name="arrow-left" size={22} color="#ff7f00" />
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={styles.logoRow}>
            <Image
              source={require("../../assets/images/Page0.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>VibrA</Text>
          </View>
          <Text style={styles.tagline}>FIND YOUR SPARK</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>

          <Text style={styles.title}>Create your{"\n"}account</Text>
          <Text style={styles.subtitle}>Be yourself — authenticity attracts</Text>

          <View style={styles.dobChip}>
            <AntDesign name="calendar" size={14} color="#ff7f00" />
            <Text style={styles.dobChipText}>{dobDisplay}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.dobChipEdit}>Edit</Text>
            </TouchableOpacity>
          </View>

          {errors._server && (
            <View style={styles.serverErrorRow}>
              <AntDesign name="exclamation-circle" size={13} color="#d00000" />
              <Text style={styles.serverErrorText}>{errors._server}</Text>
            </View>
          )}

          {/* Name */}
          <Animated.View style={[
            styles.inputWrapper,
            { borderColor: getBorderColor(nameFocus, !!errors.name), shadowOpacity: getShadowOpacity(nameFocus) },
          ]}>
            <AntDesign name="user" size={16} color={errors.name ? "#d00000" : "#C8C8C8"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#C8C8C8"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
              }}
              onFocus={() => animateFocus(nameFocus, true)}
              onBlur={() => animateFocus(nameFocus, false)}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              selectionColor="#ff7f00"
            />
          </Animated.View>
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          {/* Email */}
          <Animated.View style={[
            styles.inputWrapper,
            { borderColor: getBorderColor(emailFocus, !!errors.email), shadowOpacity: getShadowOpacity(emailFocus) },
          ]}>
            <AntDesign name="mail" size={16} color={errors.email ? "#d00000" : "#C8C8C8"} style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#C8C8C8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
              }}
              onFocus={() => animateFocus(emailFocus, true)}
              onBlur={() => animateFocus(emailFocus, false)}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              selectionColor="#ff7f00"
            />
          </Animated.View>
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

          {/* Password */}
          <Animated.View style={[
            styles.inputWrapper,
            { borderColor: getBorderColor(passFocus, !!errors.pass), shadowOpacity: getShadowOpacity(passFocus) },
          ]}>
            <AntDesign name="lock" size={16} color={errors.pass ? "#d00000" : "#C8C8C8"} style={styles.inputIcon} />
            <TextInput
              ref={passRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#C8C8C8"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              value={pass}
              onChangeText={(text) => {
                setPass(text);
                if (errors.pass) setErrors(prev => ({ ...prev, pass: "" }));
              }}
              onFocus={() => animateFocus(passFocus, true)}
              onBlur={() => animateFocus(passFocus, false)}
              returnKeyType="next"
              onSubmitEditing={() => confRef.current?.focus()}
              selectionColor="#ff7f00"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons 
                name={showPass ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={showPass ? "#ff7f00" : "#C8C8C8"} 
              />
            </TouchableOpacity>
          </Animated.View>
          {errors.pass ? <Text style={styles.error}>{errors.pass}</Text> : null}

          {/* Confirm Password */}
          <Animated.View style={[
            styles.inputWrapper,
            { borderColor: getBorderColor(confFocus, !!errors.conf), shadowOpacity: getShadowOpacity(confFocus) },
          ]}>
            <AntDesign name="lock" size={16} color={errors.conf ? "#d00000" : "#C8C8C8"} style={styles.inputIcon} />
            <TextInput
              ref={confRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm password"
              placeholderTextColor="#C8C8C8"
              secureTextEntry={!showConf}
              autoCapitalize="none"
              autoCorrect={false}
              value={confPass}
              onChangeText={(text) => {
                setConfPass(text);
                if (errors.conf) setErrors(prev => ({ ...prev, conf: "" }));
              }}
              onFocus={() => animateFocus(confFocus, true)}
              onBlur={() => animateFocus(confFocus, false)}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              selectionColor="#ff7f00"
            />
            <TouchableOpacity onPress={() => setShowConf(!showConf)} style={styles.eyeBtn}>
              <Ionicons 
                name={showConf ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={showConf ? "#ff7f00" : "#C8C8C8"} 
              />
            </TouchableOpacity>
          </Animated.View>
          {errors.conf ? <Text style={styles.error}>{errors.conf}</Text> : null}

          {/* Gender */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <Animated.View
                key={g.value}
                style={{ flex: 1, transform: [{ scale: genderScales[g.value] }] }}
              >
                <TouchableOpacity
                  style={[
                    styles.genderBtn,
                    gender === g.value && styles.genderBtnActive,
                  ]}
                  onPress={() => {
                    handleGenderSelect(g.value);
                    if (errors.gender) setErrors(prev => ({ ...prev, gender: "" }));
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.genderIcon}>{g.icon}</Text>
                  <Text style={[styles.genderLabel, gender === g.value && styles.genderLabelActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}

          {/* Terms */}
          <TouchableOpacity 
            style={styles.checkRow} 
            onPress={() => {
              setAgree(!agree);
              if (errors.agree) setErrors(prev => ({ ...prev, agree: "" }));
            }} 
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
              {agree && <AntDesign name="check" size={12} color="#fff" />}
            </View>
            <Text style={styles.checkLabel}>
              I agree to the{" "}
              <Text style={styles.checkLink}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={styles.checkLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.agree ? <Text style={styles.error}>{errors.agree}</Text> : null}

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createBtn, (!isFormValid || loading) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.createBtnText}>Create Account</Text>
                <AntDesign name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.signinText}>
            Already have an account?{" "}
            <Text style={styles.signinLink} onPress={() => router.push("../login")}>
              Sign In
            </Text>
          </Text>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logoImage: {
    width: 28,
    height: 28,
    tintColor: "#ff7f00",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ff7f00",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    color: "#C8C8C8",
    letterSpacing: 2,
    marginBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff7f00",
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 11,
    color: "#C8C8C8",
    marginBottom: 28,
    fontWeight: "500",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#999",
    marginBottom: 20,
  },
  dobChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dobChipText: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  dobChipEdit: {
    fontSize: 13,
    color: "#ff7f00",
    fontWeight: "600",
    marginLeft: 4,
  },
  serverErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  serverErrorText: {
    color: "#d00000",
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 4,
    minHeight: 52,
    shadowColor: "#ff7f00",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "#d00000",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
    marginTop: 4,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  genderBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#ECECEC",
    backgroundColor: "#fff",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  genderBtnActive: {
    borderColor: "#ff7f00",
    backgroundColor: "#fff",
    shadowColor: "#ff7f00",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  genderIcon: {
    fontSize: 18,
    color: "#ff7f00",
  },
  genderLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#C8C8C8",
  },
  genderLabelActive: {
    color: "#ff7f00",
    fontWeight: "700",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginVertical: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#ff7f00",
    borderColor: "#ff7f00",
  },
  checkLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  checkLink: {
    color: "#ff7f00",
    fontWeight: "600",
  },
  createBtn: {
    backgroundColor: "#ff7f00",
    paddingVertical: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    minHeight: 56,
    shadowColor: "#ff7f00",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  createBtnDisabled: {
    backgroundColor: "#ffd0a8",
    shadowOpacity: 0,
    elevation: 0,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  signinText: {
    textAlign: "center",
    fontSize: 14,
    color: "#999",
    marginTop: 20,
  },
  signinLink: {
    color: "#ff7f00",
    fontWeight: "700",
  },
});