import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  languageMapping,
  getLanguageName,
} from "../(detectlanguage)/displayIndNote";
import { IpAddressBackend } from "@/IpBackendReturn";
import { Colors } from "@/styles/Colors";
export default function TranslateNote() {
  const { noteTitle, noteContent, timestamp, id, username } =
    useLocalSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isdefault, setDefault] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [status, setStatus] = useState("default"); // default, loading, success, issue
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    if (noteContent && noteTitle && timestamp && id && username) {
      console.log(
        "on translate page",
        username,
        id,
        noteContent,
        noteTitle,
        timestamp
      );
    }
  }, [noteTitle, noteContent, timestamp, id, username]);

  useEffect(() => {
    if (!isdefault) {
      makeAPICall();
    }
    console.log(selectedLanguage);
    setDefault(false);
  }, [selectedLanguage]);

  const makeAPICall = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`http://${IpAddressBackend}:5000/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: noteContent,
          target_language: selectedLanguage ? selectedLanguage : "en",
        }),
      });
      const data = await res.json();
      if (data.status === "pass") {
        setTranslatedText(data.translated_text);
        console.log(data.translated_text, " translated note ");
        setStatus("success");
      } else {
        throw new Error("Something Went Wrong While Translating");
      }
    } catch (error) {
      console.error("Translation error:", error);
      setStatus("issue");
    }
  };

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    setDropdownVisible(false);
  };

  const copyToClipboard = () => {
    Clipboard.setString(translatedText);
    // Show feedback based on platform
    if (Platform.OS === "android") {
      ToastAndroid.show("Text copied to clipboard!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Text copied to clipboard!");
    }
  };

  // Function to retry translation
  const retryTranslation = () => {
    makeAPICall();
  };

  // Render translated content based on status
  const renderTranslatedContent = () => {
    switch (status) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Translating...</Text>
          </View>
        );
      case "success":
        return (
          <View>
            <Text style={styles.translatedContent}>{translatedText}</Text>
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
            <Ionicons name="warning-outline" size={40} color="#f44336" />
            <Text style={styles.errorText}>Translation failed</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryTranslation}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <Text style={styles.placeholderText}>
            Your translated note will appear here...
          </Text>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Translate Notes</Text>

      <View style={styles.noteSection}>
        <Text style={styles.sectionLabel}>Your Note</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{noteTitle}</Text>
          <Text style={styles.noteContent}>{noteContent}</Text>
        </View>
      </View>

      <View style={styles.languageSection}>
        <Text style={styles.sectionLabel}>Select Language</Text>

        {/* Custom Dropdown */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {getLanguageName(selectedLanguage) || "English"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#333" />
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>Select Language</Text>
                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={Object.keys(languageMapping)}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.languageItem,
                      selectedLanguage === item && styles.selectedLanguageItem,
                    ]}
                    onPress={() => handleLanguageSelect(item)}
                  >
                    <Text
                      style={[
                        styles.languageItemText,
                        selectedLanguage === item &&
                          styles.selectedLanguageItemText,
                      ]}
                    >
                      {getLanguageName(item)}
                    </Text>
                    {selectedLanguage === item && (
                      <Ionicons name="checkmark" size={20} color="#6200ee" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <View style={styles.translatedSection}>
        <Text style={styles.sectionLabel}>Translated Note</Text>
        <View style={[styles.noteCard, status === "issue" && styles.errorCard]}>
          {renderTranslatedContent()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  noteSection: {
    marginBottom: 20,
  },
  noteCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorCard: {
    borderColor: "#ffcdd2",
    borderWidth: 1,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  translatedContent: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  languageSection: {
    marginBottom: 20,
  },
  dropdownButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedLanguageItem: {
    backgroundColor: "#f0e6ff",
  },
  languageItemText: {
    fontSize: 16,
  },
  selectedLanguageItemText: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  translatedSection: {
    marginBottom: 40,
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.primary,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#f44336",
    fontSize: 16,
    marginBottom: 16,
  },
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
  retryButton: {
    backgroundColor: "#6200ee",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
});
