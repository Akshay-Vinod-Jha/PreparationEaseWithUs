// import React, { useState } from "react";
// import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
// import LogoHeader from "@/components/LogoHeader";
// import InputField from "@/components/InputField";
// import Button from "@/components/Button";

// const RegisterScreen = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [securePassword, setSecurePassword] = useState(true);
//   const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <LogoHeader />

//       <InputField
//         label="Username"
//         value={username}
//         onChangeText={setUsername}
//         placeholder="Enter your username"
//       />

//       <InputField
//         label="Password"
//         value={password}
//         onChangeText={setPassword}
//         placeholder="Enter password"
//         secureTextEntry={securePassword}
//         showPasswordToggle
//         onTogglePassword={() => setSecurePassword(!securePassword)}
//       />

//       <InputField
//         label="Confirm Password"
//         value={confirmPassword}
//         onChangeText={setConfirmPassword}
//         placeholder="Confirm password"
//         secureTextEntry={secureConfirmPassword}
//         showPasswordToggle
//         onTogglePassword={() =>
//           setSecureConfirmPassword(!secureConfirmPassword)
//         }
//       />

//       <Button title="Register" onPress={() => alert("Registered!")} />
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F8F5FC",
//     paddingHorizontal: 20,
//   },
// });

// export default RegisterScreen;
import React, { useState } from "react";
import InputField from "@/components/InputField";
import { View, Text, Image, StyleSheet } from "react-native";
import { db, setDoc, doc, getDoc } from "@/firebaseConfig";
import { Colors } from "@/styles/Colors";
import Button from "@/components/Button";
import { useRouter } from "expo-router";
import { StatusBar } from "react-native";
const RegisterScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState("no-operation");
  const [issuereason, setIssueReason] = useState("");

  const ImageSource = require("../../images/Logo.png");
  const registerUserFun = async () => {
    setLoginStatus("loading");
    console.log("username:-", username);
    console.log("password:-", password);
    console.log("confirm password:-", confirmPassword);
    try {
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        throw new Error("Username,Password,Confirm Password Cannot be Empty");
      }
      if (password.trim() != confirmPassword.trim()) {
        throw new Error("Password and Confirm Password did not Matched");
      }
      const snapshot = await getDoc(doc(db, "users", username));
      if (snapshot.exists()) {
        console.log("username is already occupied");
        throw new Error("A User with this Username is already Available");
      }
      const data = await setDoc(doc(db, "users", username.trim()), {
        password: password.trim(),
      });
      setConfirmPassword((a) => a.trim());
      setPassword((a) => a.trim());
      setUsername((a) => a.trim());
      console.log("registration successfull for user", data);
      setLoginStatus("success");
      setTimeout(() => {
        router.push({
          pathname: "/",
        });
      }, 2100);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong, try again";
      setIssueReason(errorMessage);
      console.log("status regisration failed");
      setLoginStatus("issue");
    } finally {
      setTimeout(() => {
        setLoginStatus("no-operation");
      }, 2000);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPassword = () => {
    setShowConfirmPass((pass) => !pass);
  };
  return (
    <View style={styles.container}>
      {/* Circular Background with Logo */}
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />

      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <Image source={ImageSource} style={styles.logo} />
          <Text style={styles.subtitleBlack}>MAKING LEARNING EASY</Text>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.inputContainer}>
        {/* Username Field */}
        <InputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Enter Your Username here"
        />
        {/* Password Field */}
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          showPasswordToggle
          placeholder={"Enter Your Password Here"}
          onTogglePassword={togglePasswordVisibility}
        />

        {/* Confirm Password Field */}
        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPass}
          showPasswordToggle
          placeholder={"Confirm Your Password"}
          onTogglePassword={toggleConfirmPassword}
        />
      </View>

      <View style={{ width: "100%" }}>
        {/* Register Button */}
        {loginStatus === "no-operation" && (
          <Button title="Register" onPress={registerUserFun} />
        )}
        {loginStatus === "loading" && (
          <Button
            title="Wait Performing Registration"
            onPress={() => {}}
            disabled
          />
        )}
        {loginStatus === "success" && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              Registration Successful! Welcome, {username}
            </Text>
          </View>
        )}
        {loginStatus === "issue" && (
          <View style={styles.failureMessage}>
            <Text style={styles.failureText}>{issuereason}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  successMessage: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  failureMessage: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: "green",
    textAlign: "center",
    fontWeight: "600",
  },
  failureText: {
    color: "red",
    textAlign: "center",
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    width: 300,
    height: 300,
    borderRadius: 150,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  circle: {
    width: 280,
    height: 280,
    backgroundColor: Colors.primary,
    borderRadius: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: "contain",
  },
  subtitleBlack: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
    marginTop: 10,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3E2A68",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 20,
    width: "100%",
    fontSize: 14,
    color: "#000",
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    paddingRight: 40,
    marginBottom: 10,
  },
  inputField: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#000",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
