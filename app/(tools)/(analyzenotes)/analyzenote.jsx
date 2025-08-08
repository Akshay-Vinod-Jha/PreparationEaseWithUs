import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ToastAndroid,
  SafeAreaView,
  Clipboard,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { IpAddressBackend } from "@/IpBackendReturn";
import { Colors } from "@/styles/Colors";
export default function AnalyzeNote() {
  const { noteTitle, noteContent, timestamp, id, username } =
    useLocalSearchParams();

  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState("default"); // default, loading, success, issue
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullNote, setShowFullNote] = useState(false);

  useEffect(() => {
    console.log(
      "on analyze page",
      username,
      id,
      noteContent?.substring(0, 30),
      noteTitle,
      timestamp
    );
    if (noteContent && noteTitle && timestamp && id && username) {
      console.log(
        "on analyze page",
        username,
        id,
        noteContent?.substring(0, 30),
        noteTitle,
        timestamp
      );
      getLangFirst();
    } else {
      console.error("Missing required parameters:", {
        noteTitle: !!noteTitle,
        noteContent: !!noteContent,
        timestamp: !!timestamp,
        id: !!id,
        loc: !!loc,
        dir: !!dir,
        username: !!username,
      });
      setStatus("issue");
      setErrorMessage("Missing required note information");
    }
  }, [noteTitle, noteContent, timestamp, id, username]);

  const summarize_text = async (target_language) => {
    setStatus("loading");
    try {
      console.log("Making summarize request with language:", target_language);
      console.log(
        "Sending text to summarize:",
        noteContent?.substring(0, 50) + "..."
      );

      const res = await fetch(`http://${IpAddressBackend}:5000/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: noteContent,
          target_language: target_language,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Summarize API response:", data);

      if (data.status === "pass") {
        setResponse(data);
        setStatus("success");
      } else {
        setStatus("issue");
        setErrorMessage("Failed to summarize the text");
        throw new Error("Something Went Wrong While Summarizing");
      }
    } catch (error) {
      console.error("Summarize API error:", error.message);
      setStatus("issue");
      setResponse(null);
      setErrorMessage(
        error.message || "Failed to connect to the summarize service"
      );
    }
  };
  const copyToClipboard = () => {
    Clipboard.setString(response.translated_summary);
    // Show feedback based on platform
    if (Platform.OS === "android") {
      ToastAndroid.show("Text copied to clipboard!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Text copied to clipboard!");
    }
  };
  const getLangFirst = async () => {
    setStatus("loading");
    try {
      console.log("Making language detection request");

      const res = await fetch(
        `http://${IpAddressBackend}:5000/detect-language`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: noteContent }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Language detection API response:", data);

      if (data.status === "pass") {
        const language = data.language;
        console.log("Detected language:", language);
        await summarize_text(language);
      } else {
        setStatus("issue");
        setErrorMessage("Failed to detect the language");
        throw new Error("Failed to Detect the Language");
      }
    } catch (error) {
      console.error("Language detection API error:", error.message);
      setStatus("issue");
      setErrorMessage(
        error.message || "Failed to connect to the language detection service"
      );
    }
  };

  const retryAnalysis = () => {
    getLangFirst();
  };
  // Helper function to truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Analyzing your note...</Text>
            <Text style={styles.loadingSubtext}>
              Detecting language and generating insights
            </Text>
          </View>
        );
      case "success":
        return (
          <View style={styles.resultContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  {response?.summary ||
                    response?.summarized_text ||
                    "No summary available"}
                </Text>
                {response?.translated_summary && (
                  <View style={styles.translationContainer}>
                    <Text style={styles.translationLabel}>Translation:</Text>
                    <Text style={styles.translationText}>
                      {response.translated_summary}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyButtonText}>Copy Translation</Text>
            </TouchableOpacity>
          </View>
        );
      case "issue":
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color="#f44336" />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || "Something went wrong"}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryAnalysis}
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
              Preparing to analyze your note...
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
            <Text style={styles.noteContent}>
              {showFullNote ? noteContent : truncateText(noteContent)}
            </Text>
            {noteContent && noteContent.length > 150 && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowFullNote(!showFullNote)}
              >
                <Text style={styles.toggleButtonText}>
                  {showFullNote ? "Show Less" : "Show More"}
                </Text>
                <Ionicons
                  name={showFullNote ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#6200ee"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.analysisSection}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Analysis Results</Text>
          </View>
          <View style={styles.analysisCard}>{renderContent()}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  copyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  copyButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    width: 40,
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
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
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
    marginBottom: 12,
    color: "#333",
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
    marginRight: 4,
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
  defaultContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
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
  resultContainer: {
    padding: 20,
    position: "relative",
  },
  languageBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  languageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  summaryCard: {
    backgroundColor: "#f8f8ff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  translationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    fontStyle: "italic",
  },
});
