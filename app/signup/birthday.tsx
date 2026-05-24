import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export default function BirthdayScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const [focusedInput, setFocusedInput] = useState<'day' | 'month' | 'year' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const dayBorderAnim = useRef(new Animated.Value(0)).current;
  const monthBorderAnim = useRef(new Animated.Value(0)).current;
  const yearBorderAnim = useRef(new Animated.Value(0)).current;

  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const currentYear = new Date().getFullYear();

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

  const validateAge = (d: string, m: string, y: string) => {
    if (d.length < 2 || m.length < 2 || y.length < 4) return '';
    const birthDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) return '• You must be 18 or older to join';
    return '';
  };

  const validateStepByStep = () => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (day.length === 2 && (isNaN(dayNum) || dayNum < 1 || dayNum > 31))
      return '• Invalid day';
    if (month.length === 2 && (isNaN(monthNum) || monthNum < 1 || monthNum > 12))
      return '• Invalid month';
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear)
        return '• Invalid year';
      
      const date = new Date(yearNum, monthNum - 1, dayNum);
      if (
        isNaN(date.getTime()) ||
        date.getFullYear() !== yearNum ||
        date.getMonth() !== monthNum - 1 ||
        date.getDate() !== dayNum
      ) return '• Invalid date entered';
    }
    return validateAge(day, month, year);
  };

  const isValid =
    error === '' &&
    day.length === 2 &&
    month.length === 2 &&
    year.length === 4;

  useEffect(() => {
    setError(validateStepByStep());
  }, [day, month, year]);

  const handleNext = () => {
    const msg = validateStepByStep();
    if (!msg && isValid) {
      router.push({ pathname: './create-account', params: { day, month, year } });
    } else if (msg) {
      setError(msg);
    }
  };

  const getInputStyle = (anim: Animated.Value, filled: boolean, hasError: boolean) => {
    const borderColor = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [hasError ? '#d00000' : '#ECECEC', '#ff7f00'],
    });
    return {
      borderColor,
      shadowOpacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
    };
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.container}>

        <TouchableOpacity onPress={() => router.push('../login')} style={styles.backBtn}>
          <AntDesign name="arrow-left" size={22} color="#ff7f00" />
        </TouchableOpacity>

        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/Page0.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>VibrA</Text>
          </View>
          <Text style={styles.tagline}>FIND YOUR SPARK</Text>

          {/* Progress — Step 1 of 2 */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>

          <Text style={styles.title}>When&apos;s your{'\n'}birthday?</Text>
          <Text style={styles.subtitle}>Only your age will be visible to others</Text>

          <View style={styles.ageBadge}>
            <AntDesign name="info-circle" size={13} color="#ff7f00" />
            <Text style={styles.ageBadgeText}>Must be 18 or older to join VibrA</Text>
          </View>

          <View style={styles.inputRow}>

            {/* Day Input */}
            <View style={styles.inputGroup}>
              <Animated.View style={[
                styles.inputContainer,
                getInputStyle(dayBorderAnim, day.length === 2, error.includes('day') || error.includes('date')),
              ]}>
                <TextInput
                  ref={dayRef}
                  placeholder="DD"
                  maxLength={2}
                  keyboardType="numeric"
                  style={styles.input}
                  value={day}
                  onChangeText={(text) => { 
                    if (/^\d{0,2}$/.test(text)) {
                      setDay(text);
                      if (text.length === 2 && parseInt(text, 10) > 0) {
                        monthRef.current?.focus();
                      }
                    }
                  }}
                  onFocus={() => { setFocusedInput('day'); animateFocus(dayBorderAnim, true); }}
                  onBlur={() => {
                    setFocusedInput(null);
                    animateFocus(dayBorderAnim, false);
                    if (day.length === 1 && parseInt(day, 10) > 0) setDay('0' + day);
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => monthRef.current?.focus()}
                  placeholderTextColor="#C8C8C8"
                  selectionColor="#ff7f00"
                />
              </Animated.View>
              <Text style={styles.inputLabel}>Day</Text>
            </View>

            {/* Month Input */}
            <View style={styles.inputGroup}>
              <Animated.View style={[
                styles.inputContainer,
                getInputStyle(monthBorderAnim, month.length === 2, error.includes('month') || error.includes('date')),
              ]}>
                <TextInput
                  ref={monthRef}
                  placeholder="MM"
                  maxLength={2}
                  keyboardType="numeric"
                  style={styles.input}
                  value={month}
                  onChangeText={(text) => { 
                    if (/^\d{0,2}$/.test(text)) {
                      setMonth(text);
                      if (text.length === 2 && parseInt(text, 10) > 0) {
                        yearRef.current?.focus();
                      }
                    }
                  }}
                  onFocus={() => { setFocusedInput('month'); animateFocus(monthBorderAnim, true); }}
                  onBlur={() => {
                    setFocusedInput(null);
                    animateFocus(monthBorderAnim, false);
                    if (month.length === 1 && parseInt(month, 10) > 0) setMonth('0' + month);
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => yearRef.current?.focus()}
                  placeholderTextColor="#C8C8C8"
                  selectionColor="#ff7f00"
                />
              </Animated.View>
              <Text style={styles.inputLabel}>Month</Text>
            </View>

            {/* Year Input */}
            <View style={[styles.inputGroup, { flex: 1.5 }]}>
              <Animated.View style={[
                styles.inputContainer,
                getInputStyle(yearBorderAnim, year.length === 4, error.includes('year') || error.includes('date') || error.includes('18')),
              ]}>
                <TextInput
                  ref={yearRef}
                  placeholder="YYYY"
                  maxLength={4}
                  keyboardType="numeric"
                  style={styles.input}
                  value={year}
                  onChangeText={(text) => { if (/^\d{0,4}$/.test(text)) setYear(text); }}
                  onFocus={() => { setFocusedInput('year'); animateFocus(yearBorderAnim, true); }}
                  onBlur={() => { setFocusedInput(null); animateFocus(yearBorderAnim, false); }}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  placeholderTextColor="#C8C8C8"
                  selectionColor="#ff7f00"
                />
              </Animated.View>
              <Text style={styles.inputLabel}>Year</Text>
            </View>

          </View>

          {error.length > 0 && (
            <View style={styles.errorRow}>
              <AntDesign name="exclamation-circle" size={13} color="#d00000" />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

        </Animated.View>

        <View style={[styles.buttonWrapper, { marginTop: Math.max(height * 0.04, 20) }]}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.disabledButton]}
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <AntDesign name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoImage: {
    width: 28,
    height: 28,
    tintColor: '#ff7f00',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff7f00',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    color: '#C8C8C8',
    letterSpacing: 2,
    marginBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff7f00',
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 11,
    color: '#C8C8C8',
    marginBottom: 28,
    fontWeight: '500',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ageBadgeText: {
    fontSize: 13,
    color: '#ff7f00',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 6,
    shadowColor: '#ff7f00',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  input: {
    paddingVertical: 18,
    paddingHorizontal: 10,
    fontSize: 20,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  inputLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: '#C8C8C8',
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  error: {
    color: '#d00000',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonWrapper: {
    paddingBottom: 8,
  },
  button: {
    backgroundColor: '#ff7f00',
    paddingVertical: 17,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7f00',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ffd0a8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});