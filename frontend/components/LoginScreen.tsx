import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  
  const [isSignInForm, setIsSignInForm] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleAuth = async () => {
    if (isSignInForm) {
      if (!isLoaded) return;
      setLoading(true);
      try {
        const completeSignIn = await signIn.create({ identifier: username, password });
        if (completeSignIn.status === 'complete') {
          await setActive({ session: completeSignIn.createdSessionId });
        }
      } catch (err: any) {
        showAlert('Login Failed', err.errors?.[0]?.message || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    } else {
      if (!isSignUpLoaded) return;
      setLoading(true);
      try {
        const completeSignUp = await signUp.create({ username, password });
        if (completeSignUp.status === 'complete') {
          await setSignUpActive({ session: completeSignUp.createdSessionId });
        } else if (completeSignUp.status === 'missing_requirements') {
          showAlert('Sign Up Pending', 'Please check your Clerk dashboard settings to disable verification or handle it.');
        }
      } catch (err: any) {
        showAlert('Sign Up Failed', err.errors?.[0]?.message || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Baht</Text>
          <Text style={styles.title}>{isSignInForm ? 'Sign in' : 'Create an account'}</Text>
          <Text style={styles.subtitle}>
            {isSignInForm ? 'Welcome back! Please enter your details.' : 'Enter your details to get started.'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isSignInForm ? 'Sign in' : 'Sign up'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignInForm ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={() => setIsSignInForm(!isSignInForm)}>
            <Text style={styles.footerLink}>{isSignInForm ? 'Sign up' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20, 
    backgroundColor: '#FAFAFA' 
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#007AFF',
    marginBottom: 16,
    letterSpacing: -1,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    fontSize: 14,
    color: '#0F172A',
  },
  button: { 
    backgroundColor: '#0F172A', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  }
});
