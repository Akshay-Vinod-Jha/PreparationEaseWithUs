import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/styles/Colors";
export default function Profile() {
  const [status, setStatus] = useState("default");
  const [len, setLen] = useState(0);
  const router = useRouter();
  const { username } = useLocalSearchParams();

  const getAllNotes = async (username) => {
    setStatus("loading");
    try {
      const collectionRef = collection(db, `users/${username}/notes`);
      const snapshot = await getDocs(collectionRef);
      console.log(snapshot.docs.length);
      setLen(snapshot.docs.length);
      setStatus("success");
    } catch (error) {
      setStatus("issue");
    }
  };

  useEffect(() => {
    getAllNotes(username);
  }, [username]);

  const viewNotes = () => {
    router.push({
      pathname: "/(addnotes)/addnote",
      params: { username },
    });
  };

  const resetPassword = () => {
    router.push({
      pathname: "/(authentication)/ForgotPassword",
      params: { username },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {username ? username[0].toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsLabel}>Notes</Text>
        <View style={styles.statsValue}>
          {status === "loading" && (
            <ActivityIndicator size="small" color="#0066CC" />
          )}
          {status === "success" && (
            <Text style={styles.statsNumber}>{len}</Text>
          )}
          {status === "issue" && (
            <Text style={styles.errorText}>Error loading notes</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={viewNotes}>
          <Text style={styles.buttonText}>View Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetPassword}
        >
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.backgroundLight,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  statsValue: {
    minWidth: 40,
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  errorText: {
    color: "#d9534f",
    fontSize: 14,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
