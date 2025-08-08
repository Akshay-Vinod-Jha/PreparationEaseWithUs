import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { IpAddressBackend } from "@/IpBackendReturn";
import { Colors } from "@/styles/Colors";
export default function ExtractKeywords() {
  const [impObject, setImpObj] = useState(null);
  const [status, setStatus] = useState("default"); // default, issue, success, loading
  const [errorMessage, setErrorMessage] = useState("");
  const { noteTitle, noteContent, timestamp, id, username } =
    useLocalSearchParams();

  useEffect(() => {
    if (noteTitle && noteContent && timestamp && id && username) {
      console.log("From Extract Keywords Page", {
        noteTitle,
        noteContent: noteContent.substring(0, 30) + "...",
        timestamp,
        id,
        username,
      });
      getExtraInfo();
    } else {
      console.error("Missing required parameters", {
        noteTitle: !!noteTitle,
        noteContent: !!noteContent,
        timestamp: !!timestamp,
        id: !!id,
        username: !!username,
      });
      setStatus("issue");
      setErrorMessage("Missing required note information");
    }
  }, [noteTitle, noteContent, timestamp, id, username]);

  const getExtraInfo = async () => {
    try {
      setStatus("loading");
      const res = await fetch(`http://${IpAddressBackend}:5000/extra-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: noteContent }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.status === "pass") {
        setImpObj(data.data);
        console.log("Extracted Keywords:", Object.keys(data.data));
        setStatus("success");
      } else {
        throw new Error("API returned failure status");
      }
    } catch (error) {
      console.error("Error fetching extra info:", error.message);
      setStatus("issue");
      setErrorMessage(error.message || "Failed to extract keywords");
      setImpObj(null);
    }
  };

  const retryExtraction = () => {
    getExtraInfo();
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Extracting keywords...</Text>
            <Text style={styles.loadingSubtext}>
              Analyzing text to identify key information
            </Text>
          </View>
        );
      case "success":
        return (
          <ScrollView
            style={styles.resultScrollView}
            showsVerticalScrollIndicator={false}
          >
            {impObject &&
              Object.entries(impObject)
                .filter(
                  ([_, keywordData]) =>
                    keywordData.related_info &&
                    keywordData.related_info !== "No related information found."
                )
                .map(([keyword, keywordData]) => (
                  <View key={keyword} style={styles.keywordCard}>
                    <Text style={styles.keywordTitle}>{keyword}</Text>
                    <Text style={styles.keywordValue}>
                      {keywordData.related_info}
                    </Text>
                  </View>
                ))}
          </ScrollView>
        );
      case "issue":
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color="#f44336" />
            <Text style={styles.errorTitle}>Extraction Failed</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || "Something went wrong"}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryExtraction}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.defaultContainer}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.defaultText}>
              Preparing to extract keywords...
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.noteSection}>
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>{timestamp}</Text>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{noteTitle}</Text>
            <Text style={styles.noteContent}>{noteContent}</Text>
          </View>
        </View>

        <View style={styles.analysisSection}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Key Terms</Text>
          </View>
          <View style={styles.analysisCard}>{renderContent()}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 16,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 14,
    color: "#666",
  },
  noteCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  analysisSection: {
    marginBottom: 40,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  analysisCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "500",
    color: Colors.primary,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  resultScrollView: {
    padding: 16,
  },
  keywordCard: {
    backgroundColor: "#f8f8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keywordTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
  keywordValue: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  defaultContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f44336",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: "#6200ee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  retryButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
