import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function CreateAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const safeParam = (param: string | string[] | undefined) =>
    Array.isArray(param) ? param[0] : param || '';

  const day = safeParam(params.day);
  const month = safeParam(params.month);
  const year = safeParam(params.year);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confRef = useRef<TextInput>(null);

  const API_BASE_URL = Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.6:5000';

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.includes('@')) newErrors.email = 'Enter valid email';
    if (pass.length < 6) newErrors.pass = 'Password too short';
    if (pass !== confPass) newErrors.conf = 'Passwords do not match';
    if (!agree) newErrors.agree = 'You must agree to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    try {
      const username = email.split('@')[0];
      const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        username,
        email,
        password: pass,
        fullName: name,
        birthDate,
      });

      Alert.alert('Success', 'Account created successfully!');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    }
  };

  const isFormValid = name && email && pass && confPass && agree;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={23} color="#ff7f00" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
      </View>

      <View style={styles.formWrapper}>
        {/* Name */}
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Name"
          placeholderTextColor="#cc9966"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          selectionColor="#ff7f00"
          cursorColor="#ff7f00"
        />
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        {/* Email */}
        <TextInput
          ref={emailRef}
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#cc9966"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          selectionColor="#ff7f00"
          cursorColor="#ff7f00"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        {/* Password */}
        <View style={[styles.inputWrapper, errors.pass && styles.inputError]}>
          <TextInput
            ref={passRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#cc9966"
            secureTextEntry={!showPass}
            value={pass}
            onChangeText={setPass}
            returnKeyType="next"
            onSubmitEditing={() => confRef.current?.focus()}
            selectionColor="#ff7f00"
            cursorColor="#ff7f00"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPass(!showPass)}
          >
            <AntDesign name={showPass ? 'eye' : 'eyeo'} size={20} color="#666" />
          </TouchableOpacity>
        </View>
        {errors.pass && <Text style={styles.error}>{errors.pass}</Text>}

        {/* Confirm Password */}
        <View style={[styles.inputWrapper, errors.conf && styles.inputError]}>
          <TextInput
            ref={confRef}
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#cc9966"
            secureTextEntry={!showConf}
            value={confPass}
            onChangeText={setConfPass}
            selectionColor="#ff7f00"
            cursorColor="#ff7f00"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConf(!showConf)}
          >
            <AntDesign name={showConf ? 'eye' : 'eyeo'} size={20} color="#666" />
          </TouchableOpacity>
        </View>
        {errors.conf && <Text style={styles.error}>{errors.conf}</Text>}

        {/* Date of Birth */}
        <Text style={styles.dobLabel}>Date of Birth:</Text>
        <Text style={styles.dobText}>{`${parseInt(day)}.${monthNames[parseInt(month) - 1]}.${year}`}</Text>

        {/* Checkbox */}
        <View style={styles.checkRow}>
          <TouchableOpacity
            style={[styles.checkbox, agree && styles.checkboxChecked]}
            onPress={() => setAgree(!agree)}
          >
            {agree && <AntDesign name="check" size={14} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.checkLabel}>I agree to the Terms and Privacy Policy</Text>
        </View>
        {errors.agree && <Text style={styles.error}>{errors.agree}</Text>}

        {/* Create Account */}
        <TouchableOpacity
          style={[styles.createButton, !isFormValid && styles.disabledButton]}
          onPress={handleCreate}
          disabled={!isFormValid}
        >
          <Text style={styles.createButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Google Auth */}
        <TouchableOpacity style={styles.createButton}>
          <AntDesign name="google" size={20} color="#fff" style={{ marginRight: 12 }} />
          <Text style={styles.createButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    backgroundColor: '#fff',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 39,
    gap: 16,
    marginTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff7f00',
  },
  formWrapper: {
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff7e6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#663300',
    borderWidth: 1,
    borderColor: '#ff7f00',
    marginBottom: 15,
  },
  inputWrapper: {
    position: 'relative',
   
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -16 }],
    zIndex: 10,
  },
  inputError: {
    borderColor: '#d00000',
  },
  error: {
    color: '#d00000',
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  dobLabel: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ff7f00',
  },
  dobText: {
    fontSize: 16,
    marginBottom: 14,
    color: '#333',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ff7f00',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ff7f00',
  },
  checkLabel: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1,
  },
  createButton: {
    backgroundColor: '#ff7f00',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ffc180',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
