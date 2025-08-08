import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import InputField from "@/components/InputField";
import { Colors } from "@/styles/Colors";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
const ForgotPasswordScreen = () => {
  const [username, setUsername] = useState("");
  const [allsetpassword, setAllsetpassword] = useState("");
  const [allsetpasswordVisible, setAllsetpasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [status, setStatus] = useState("default");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const ImageSource = require("../../images/Logo.png");
  const params = useLocalSearchParams();
  useEffect(() => {
    setUsername(params.username);
  }, [params.username]);
  const updatePasswordFun = async (username) => {
    try {
      const docref = doc(db, "users", username);
      await updateDoc(docref, {
        password: confirmPassword,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const checkisUserAvailable = async () => {
    try {
      console.log(username, "from check is user available");
      const snapshot = await getDoc(doc(db, "users", username));
      if (snapshot.exists()) {
        console.log(snapshot.data());
        return { status: true, data: snapshot.data() };
      }
      return { status: false };
    } catch (error) {
      console.log(error);
      return { status: false };
    }
  };

  const handleForgotPassword = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      console.log("username:-", username);
      console.log("confirm pass:-", confirmPassword);
      console.log("all set password:-", allsetpassword);

      if (
        username.trim() === "" ||
        confirmPassword.trim() === "" ||
        allsetpassword.trim() === ""
      ) {
        throw new Error("Username or Password's Cannot be Empty");
      }

      if (confirmPassword !== allsetpassword) {
        throw new Error("Confirm Password does not match the New Password");
      }

      const availableStatus = await checkisUserAvailable(username);
      if (!availableStatus.status) {
        throw new Error("Username Not Available");
      }

      const updateStatus = await updatePasswordFun(username);
      if (!updateStatus) {
        throw new Error("Something Went Wrong While Updating Password");
      }

      setStatus("success");
      console.log("successfully updated password");

      // Reset fields after successful update
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.log(error.message);
      setErrorMessage(error.message);
      setStatus("issue");

      // Reset status after showing error for some time
      setTimeout(() => {
        setStatus("default");
      }, 3000);
    }
  };

  // Render different button based on status
  const renderButton = () => {
    switch (status) {
      case "loading":
        return (
          <TouchableOpacity style={styles.confirmButton} disabled>
            <ActivityIndicator color="#fff" size="small" />
          </TouchableOpacity>
        );
      case "success":
        return (
          <TouchableOpacity
            style={[styles.confirmButton, styles.successButton]}
            disabled
          >
            <Text style={styles.confirmText}>Password Updated!</Text>
          </TouchableOpacity>
        );
      case "issue":
        return (
          <TouchableOpacity
            style={[styles.confirmButton, styles.errorButton]}
            disabled
          >
            <Text style={styles.confirmText}>Failed to Update</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.confirmText}>Confirm Change</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Illustration Placeholder */}
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />
      <View style={styles.imageContainer}>
        <Image source={ImageSource} style={styles.illustration} />
      </View>

      {/* Title and Description */}
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Trouble signing in? Reset your password now!
      </Text>

      {/* Username Field - Fixed typo in setter function name */}
      {!params.username && (
        <View style={styles.inputContainer}>
          <InputField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter Your Username here"
            editable={status !== "loading" && status !== "success"}
          />
        </View>
      )}

      {/* Password Field */}
      <View style={styles.inputContainer}>
        <InputField
          label="Set New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!confirmPasswordVisible}
          showPasswordToggle
          placeholder={"Enter Your New Password"}
          onTogglePassword={setConfirmPasswordVisible}
          editable={status !== "loading" && status !== "success"}
        />
      </View>

      {/* Confirm Password Field */}
      <View style={styles.inputContainer}>
        <InputField
          label="Confirm the New Password"
          value={allsetpassword}
          onChangeText={setAllsetpassword}
          secureTextEntry={!allsetpasswordVisible}
          showPasswordToggle
          placeholder={"Confirm Your New Password"}
          onTogglePassword={setAllsetpasswordVisible}
          editable={status !== "loading" && status !== "success"}
        />
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {/* Confirm Change Button */}
      {renderButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  illustration: {
    width: 250,
    height: 150,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2A68",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#000",
  },
  eyeIcon: {
    padding: 10,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    height: 48,
    justifyContent: "center",
  },
  successButton: {
    backgroundColor: "#28a745",
  },
  errorButton: {
    backgroundColor: "#dc3545",
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#dc3545",
    marginTop: 10,
    textAlign: "center",
  },
});

export default ForgotPasswordScreen;
