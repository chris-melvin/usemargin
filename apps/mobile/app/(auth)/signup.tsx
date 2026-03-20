import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/components/providers/auth-provider";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Check your email to confirm your account");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: "#FDFBF7" }}
    >
      <View className="flex-1 justify-center px-8">
        <Text style={authStyles.title}>Create Account</Text>
        <Text style={authStyles.subtitle}>
          Start tracking your expenses
        </Text>

        <TextInput
          style={authStyles.input}
          placeholder="Email"
          placeholderTextColor="#A8A29E"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={[authStyles.input, { marginBottom: 24 }]}
          placeholder="Password"
          placeholderTextColor="#A8A29E"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={isLoading}
          style={authStyles.ctaButton}
        >
          <LinearGradient
            colors={isLoading ? ["#5CBCBC", "#3DA8A8"] : ["#1A9E9E", "#0F6B6B"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={authStyles.ctaText}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text style={authStyles.linkText}>Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={authStyles.linkAction}>Sign In</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const authStyles = StyleSheet.create({
  title: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    color: "#1C1917",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#78716C",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#292524",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#1A9E9E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  linkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#78716C",
  },
  linkAction: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A9E9E",
  },
});
