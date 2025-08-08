import { IpAddressBackend } from "@/IpBackendReturn";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ToastAndroid,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/styles/Colors";
export default function CheckGrammar() {
  const { noteTitle, noteContent, timestamp, id, username } =
    useLocalSearchParams();
  const [correctedText, setCorrectedText] = useState("");
  const [status, setStatus] = useState("default"); // default, loading, success, issue
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullCorrectedText, setShowFullCorrectedText] = useState(false);
  const [showFullNoteContent, setShowFullNoteContent] = useState(false);
  const previewLength = 150; // Number of characters to show in preview mode

  useEffect(() => {
    if (noteTitle && noteContent && timestamp && id && username) {
      console.log(
        "From CheckGrammar ",
        noteContent,
        noteTitle,
        timestamp,
        id,
        username
      );
      correctGrammar();
    } else {
      console.error("Missing required parameters");
      setStatus("issue");
      setErrorMessage("Missing required note information");
    }
  }, [noteTitle, noteContent, timestamp, id, username]);

  const correctGrammar = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`http://${IpAddressBackend}:5000/correct`, {
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
        setCorrectedText(data.corrected_text);
        setStatus("success");
      } else {
        throw new Error("API returned failure status");
      }
    } catch (error) {
      console.error("Error correcting grammar:", error.message);
      setStatus("issue");
      setErrorMessage(error.message || "Failed to correct grammar");
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(correctedText);
    ToastAndroid.show("Corrected text copied to clipboard", ToastAndroid.SHORT);
  };

  const retryCorrection = () => {
    correctGrammar();
  };

  const toggleShowMoreCorrectedText = () => {
    setShowFullCorrectedText(!showFullCorrectedText);
  };

  const toggleShowMoreNoteContent = () => {
    setShowFullNoteContent(!showFullNoteContent);
  };

  const getDisplayCorrectedText = () => {
    if (showFullCorrectedText || correctedText.length <= previewLength) {
      return correctedText;
    }
    return correctedText.substring(0, previewLength) + "...";
  };

  const getDisplayNoteContent = () => {
    if (showFullNoteContent || noteContent.length <= previewLength) {
      return noteContent;
    }
    return noteContent.substring(0, previewLength) + "...";
  };

  const shouldShowCorrectedToggle = correctedText.length > previewLength;
  const shouldShowNoteToggle =
    noteContent && noteContent.length > previewLength;

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Correcting grammar...</Text>
            <Text style={styles.loadingSubtext}>
              Analyzing text to improve grammar and readability
            </Text>
          </View>
        );
      case "success":
        return (
          <View style={styles.resultContainer}>
            <View style={styles.correctedTextContainer}>
              <Text style={styles.correctedTextTitle}>Corrected Text</Text>
              <Text style={styles.correctedTextContent}>
                {getDisplayCorrectedText()}
              </Text>

              {shouldShowCorrectedToggle && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={toggleShowMoreCorrectedText}
                >
                  <Text style={styles.toggleButtonText}>
                    {showFullCorrectedText ? "Show Less" : "Show More"}
                  </Text>
                  <Ionicons
                    name={showFullCorrectedText ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#6200ee"
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyButtonText}>Copy Corrected Text</Text>
            </TouchableOpacity>
          </View>
        );
      case "issue":
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color="#f44336" />
            <Text style={styles.errorTitle}>Correction Failed</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || "Something went wrong"}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryCorrection}
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
              Preparing to check grammar...
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
            <Text style={styles.noteUser}>{username}</Text>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{noteTitle}</Text>
            <Text style={styles.noteContent}>{getDisplayNoteContent()}</Text>

            {shouldShowNoteToggle && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleShowMoreNoteContent}
              >
                <Text style={styles.toggleButtonText}>
                  {showFullNoteContent ? "Show Less" : "Show More"}
                </Text>
                <Ionicons
                  name={showFullNoteContent ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#6200ee"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.analysisSection}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Grammar Check</Text>
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
  noteUser: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  resultContainer: {
    padding: 20,
  },
  correctedTextContainer: {
    backgroundColor: "#f8f8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  correctedTextTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
  correctedTextContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 8,
    alignSelf: "center",
  },
  toggleButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  copyButton: {
    backgroundColor: Colors.primary,
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
    marginTop: 8,
  },
  copyButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: Colors.primary,
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
