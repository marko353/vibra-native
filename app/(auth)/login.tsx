import { AntDesign, Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Reanimated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuthContext } from "../../context/AuthContext";

const API_BASE_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";
const ORANGE = "#FF6A00";

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const phoneSchema = z.object({
  phone: z.string().min(9, "Invalid phone number").max(15, "Invalid phone number"),
  code: z.string().length(6, "Code must be 6 digits").optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;
type LoginMode = "email" | "phone";

// ─────────────────────────────────────────────────────────────
// Animated Button
// ─────────────────────────────────────────────────────────────

function AnimatedButton({
  onPress,
  disabled,
  loading,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={
            disabled
              ? (["#FFB37A", "#FFB37A"] as const)
              : (["#FF6A00", "#FF8A3D"] as const)
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{label}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Error Banner
// ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color="#FF5A5F" />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthContext();
  const { height } = useWindowDimensions();

  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("email");
  const [codeSent, setCodeSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
  });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "215871333980-r9qnsfg9fl82d1912dspet39d4tea0vg.apps.googleusercontent.com",
      offlineAccess: false,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // ─── Google Auth ─────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    if (loading) return;
    setApiError(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Force account picker by clearing cached Google session before sign in.
      try {
        const currentGoogleUser = GoogleSignin.getCurrentUser();
        if (currentGoogleUser) {
          await GoogleSignin.signOut();
        }
      } catch {}

      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;

      if (!idToken) {
        Toast.show({ type: "error", text1: "Google login failed", text2: "Missing token" });
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/api/auth/google`, { token: idToken });
      const userData = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        token: res.data.token,
      };
      setUser(userData);
      await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
      await AsyncStorage.setItem("token", userData.token);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (error?.code === statusCodes.IN_PROGRESS) {
        return;
      }
      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({ type: "error", text1: "Google Play Services unavailable" });
        return;
      }
      Toast.show({ type: "error", text1: "Google login failed" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Login ──────────────────────────────────────────────

  const onEmailSubmit = async (data: EmailFormData) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: data.email.trim(),
        password: data.password,
      });
      const userData = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        token: res.data.token,
      };
      setUser(userData);
      await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
      await AsyncStorage.setItem("token", userData.token);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      setApiError(error?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // ─── Send Code ────────────────────────────────────────────────

  const onSendCode = async (data: PhoneFormData) => {
    setApiError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/send-code`, { phone: data.phone });
      setCodeSent(true);
      phoneForm.setValue("code", "");
      setResendCountdown(60);
      Toast.show({ type: "success", text1: "Code sent!", text2: "Check your SMS" });
    } catch (error: any) {
      setApiError(error?.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify Code ──────────────────────────────────────────────

  const onVerifyCode = async (data: PhoneFormData) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-code`, {
        phone: data.phone,
        code: data.code,
      });
      const userData = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        token: res.data.token,
      };
      setUser(userData);
      await AsyncStorage.setItem("currentUser", JSON.stringify(userData));
      await AsyncStorage.setItem("token", userData.token);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      setApiError(error?.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived State & Error Handling ───────────────────────────

  const emailValue = emailForm.watch("email", "");
  const passwordValue = emailForm.watch("password", "");
  const phoneValue = phoneForm.watch("phone", "");

  const isEmailFormValid =
    emailValue.length > 0 &&
    passwordValue.length >= 6 &&
    !emailForm.formState.errors.email &&
    !emailForm.formState.errors.password;

  const isPhoneValid = phoneValue.length >= 9;

  const getActiveErrorMessage = (): string | null => {
    if (apiError) return apiError;
    if (loginMode === "email") {
      return (
        emailForm.formState.errors.email?.message ||
        emailForm.formState.errors.password?.message ||
        null
      );
    }
    return (
      phoneForm.formState.errors.phone?.message ||
      phoneForm.formState.errors.code?.message ||
      null
    );
  };

  const activeError = getActiveErrorMessage();

  // ─── Render ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: Math.max(height * 0.05, 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={[styles.logoContainer, { marginBottom: Math.max(height * 0.04, 24) }]}>
            <Image
              source={require("../../assets/images/1000006380.png")}
              style={styles.logo}
              accessibilityLabel="Vibra logo"
            />
            <Text style={styles.tagline}>Find your spark</Text>
          </View>

          {/* Underline Tabs */}
          <View style={styles.tabWrapper}>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => {
                setLoginMode("email");
                setApiError(null);
                setCodeSent(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={loginMode === "email" ? "mail" : "mail-outline"}
                size={17}
                color={loginMode === "email" ? ORANGE : "#C0C0C8"}
              />
              <Text style={[styles.tabText, loginMode === "email" && styles.tabTextActive]}>
                Email
              </Text>
              <View style={[styles.tabUnderline, loginMode === "email" && styles.tabUnderlineActive]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => {
                setLoginMode("phone");
                setApiError(null);
                setCodeSent(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={loginMode === "phone" ? "call" : "call-outline"}
                size={17}
                color={loginMode === "phone" ? ORANGE : "#C0C0C8"}
              />
              <Text style={[styles.tabText, loginMode === "phone" && styles.tabTextActive]}>
                Phone
              </Text>
              <View style={[styles.tabUnderline, loginMode === "phone" && styles.tabUnderlineActive]} />
            </TouchableOpacity>
          </View>

          {/* Email Form - POPRAVKA: Ternarni operator */}
          {isReady && loginMode === "email" ? (
            <Reanimated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(120)}
              style={styles.form}
            >
              {/* Email */}
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldGroup}>
                    <Pressable
                      style={[
                        styles.inputRow,
                        styles.inputWithShadow,
                        focusedInput === "email" && styles.inputFocused,
                        !!emailForm.formState.errors.email && styles.inputErrorBorder,
                      ]}
                      onPress={() => emailInputRef.current?.focus()}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={19}
                        color={focusedInput === "email" ? ORANGE : "#C7C7CC"}
                      />
                      <TextInput
                        ref={emailInputRef}
                        placeholder="Email address"
                        value={value}
                        onChangeText={(t) => onChange(t.trim())}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        autoComplete="email"
                        autoCorrect={false}
                        placeholderTextColor="#C7C7CC"
                        selectionColor={ORANGE}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </Pressable>
                  </View>
                )}
              />

              {/* Password */}
              <Controller
                control={emailForm.control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldGroup}>
                    <Pressable
                      style={[
                        styles.inputRow,
                        styles.inputWithShadow,
                        focusedInput === "password" && styles.inputFocused,
                        !!emailForm.formState.errors.password && styles.inputErrorBorder,
                      ]}
                      onPress={() => passwordInputRef.current?.focus()}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={19}
                        color={focusedInput === "password" ? ORANGE : "#C7C7CC"}
                      />
                      <TextInput
                        ref={passwordInputRef}
                        placeholder="Password"
                        value={value}
                        onChangeText={onChange}
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        autoCorrect={false}
                        textContentType="password"
                        autoComplete="password"
                        placeholderTextColor="#C7C7CC"
                        selectionColor={ORANGE}
                        returnKeyType="done"
                        onSubmitEditing={emailForm.handleSubmit(onEmailSubmit)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={14}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#C7C7CC"
                        />
                      </TouchableOpacity>
                    </Pressable>
                  </View>
                )}
              />

              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => router.push("/forgot-password")}
                hitSlop={10}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {activeError ? <ErrorBanner message={activeError} /> : null}

              <AnimatedButton
                onPress={emailForm.handleSubmit(onEmailSubmit)}
                disabled={!isEmailFormValid || loading}
                loading={loading}
                label="Log In"
              />
            </Reanimated.View>
          ) : null}

          {/* Phone Form - POPRAVKA: Ternarni operator */}
          {isReady && loginMode === "phone" ? (
            <Reanimated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(120)}
              style={styles.form}
            >
              {/* Phone */}
              <Controller
                control={phoneForm.control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.fieldGroup}>
                    <Pressable
                      style={[
                        styles.inputRow,
                        styles.inputWithShadow,
                        focusedInput === "phone" && styles.inputFocused,
                        codeSent && styles.inputDisabled,
                        !!phoneForm.formState.errors.phone && styles.inputErrorBorder,
                      ]}
                      onPress={() => !codeSent && phoneInputRef.current?.focus()}
                    >
                      <Ionicons
                        name="call-outline"
                        size={19}
                        color={focusedInput === "phone" ? ORANGE : "#C7C7CC"}
                      />
                      <TextInput
                        ref={phoneInputRef}
                        placeholder="+381 6X XXX XXXX"
                        value={value}
                        onChangeText={onChange}
                        style={[styles.input, codeSent && styles.inputTextDisabled]}
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                        autoComplete="tel"
                        placeholderTextColor="#C7C7CC"
                        selectionColor={ORANGE}
                        editable={!codeSent}
                        onFocus={() => setFocusedInput("phone")}
                        onBlur={() => setFocusedInput(null)}
                      />
                      {codeSent ? (
                        <TouchableOpacity
                          onPress={() => {
                            setCodeSent(false);
                            phoneForm.setValue("code", "");
                          }}
                          hitSlop={10}
                        >
                          <Ionicons name="pencil-outline" size={18} color={ORANGE} />
                        </TouchableOpacity>
                      ) : null}
                    </Pressable>
                  </View>
                )}
              />

              {/* Code - POPRAVKA: Ternarni operator */}
              {codeSent ? (
                <Controller
                  control={phoneForm.control}
                  name="code"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.fieldGroup}>
                      <Pressable
                        style={[
                          styles.inputRow,
                          styles.inputWithShadow,
                          focusedInput === "code" && styles.inputFocused,
                          !!phoneForm.formState.errors.code && styles.inputErrorBorder,
                        ]}
                        onPress={() => codeInputRef.current?.focus()}
                      >
                        <Ionicons
                          name="keypad-outline"
                          size={19}
                          color={focusedInput === "code" ? ORANGE : "#C7C7CC"}
                        />
                        <TextInput
                          ref={codeInputRef}
                          placeholder="6-digit code"
                          value={value}
                          onChangeText={onChange}
                          style={styles.input}
                          keyboardType="number-pad"
                          maxLength={6}
                          textContentType="oneTimeCode"
                          placeholderTextColor="#C7C7CC"
                          selectionColor={ORANGE}
                          autoFocus
                          onFocus={() => setFocusedInput("code")}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </Pressable>

                      {/* Resend Code */}
                      <View style={styles.resendContainer}>
                        {/* POPRAVKA: String zatvoren u template literal */}
                        {resendCountdown > 0 ? (
                          <Text style={styles.resendCountdownText}>
                            {`Resend code in ${resendCountdown}s`}
                          </Text>
                        ) : (
                          <TouchableOpacity
                            onPress={phoneForm.handleSubmit(onSendCode)}
                            hitSlop={10}
                          >
                            <Text style={styles.resendLinkText}>Resend Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                />
              ) : null}

              {activeError ? <ErrorBanner message={activeError} /> : null}

              <AnimatedButton
                onPress={
                  codeSent
                    ? phoneForm.handleSubmit(onVerifyCode)
                    : phoneForm.handleSubmit(onSendCode)
                }
                disabled={!isPhoneValid || loading}
                loading={loading}
                label={codeSent ? "Verify Code" : "Send Code"}
              />
            </Reanimated.View>
          ) : null}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.75}
          >
            <AntDesign name="google" size={19} color="#1C1C1E" />
            <Text style={styles.googleBtnText}>Google</Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => router.push("../signup/birthday")}
            hitSlop={12}
          >
            <Text style={styles.signupText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen loading overlay */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : null}

      {/* Toast uvek iznad svega */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        <Toast />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FCFCFD",
  },
  flex: {
    flex: 1,
    backgroundColor: "#FCFCFD",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#FCFCFD",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 11,
    color: "#AEAEB2",
    marginTop: 2,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  tabWrapper: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingBottom: 14,
    paddingTop: 4,
    position: "relative",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C0C0C8",
    letterSpacing: 0.1,
  },
  tabTextActive: {
    color: "#1C1C1E",
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    alignSelf: "center",
    width: 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabUnderlineActive: {
    backgroundColor: ORANGE,
  },
  form: {
    width: "100%",
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
  },
  inputWithShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inputFocused: {
    borderColor: ORANGE,
    backgroundColor: "#fff",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  inputErrorBorder: {
    borderColor: "#FF5A5F",
    backgroundColor: "#FFF9F9",
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1E",
    fontWeight: "400",
  },
  inputTextDisabled: {
    opacity: 0.5,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 22,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 13,
    color: ORANGE,
    fontWeight: "600",
  },
  resendContainer: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 4,
  },
  resendCountdownText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  resendLinkText: {
    fontSize: 13,
    color: ORANGE,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFF1F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    width: "100%",
  },
  errorBannerText: {
    color: "#FF5A5F",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  primaryBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D1D1D6",
  },
  dividerText: {
    fontSize: 12,
    color: "#AEAEB2",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFF4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  googleBtnDisabled: {
    opacity: 0.5,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  signupRow: {
    marginTop: 28,
  },
  signupText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  signupLink: {
    color: ORANGE,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 900,
  },
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});