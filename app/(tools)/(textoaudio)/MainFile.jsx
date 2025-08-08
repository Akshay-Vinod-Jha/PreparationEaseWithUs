import React, { useState, useEffect } from "react";
import { Colors } from "@/styles/Colors";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

const TextToSpeech = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { id, noteTitle, noteContent, timestamp, username, data } =
    useLocalSearchParams();

  useEffect(() => {
    console.log(
      `${id} ${noteTitle} ${noteContent} ${timestamp} ${username} ${data}`
    );
  }, [id, noteTitle, noteContent, timestamp, username, data]);

  // Fetch all available voices directly
  useEffect(() => {
    const getAllVoices = async () => {
      setIsLoading(true);
      try {
        // Get all available voices from the Speech API
        const voices = await Speech.getAvailableVoicesAsync();
        console.log("Total voices found:", voices.length);

        // Process the voices to get unique languages with all their voices
        const languageGroups = {};

        voices.forEach((voice) => {
          const { language, identifier, name, quality } = voice;

          // Create or update the language group
          if (!languageGroups[language]) {
            languageGroups[language] = {
              languageCode: language,
              displayName: getDisplayName(language),
              voices: [],
            };
          }

          // Add this voice to the language group
          languageGroups[language].voices.push({
            id: identifier,
            name: name || identifier,
            quality: quality || "Default",
          });
        });

        // Convert to array and sort alphabetically by display name
        const sortedLanguages = Object.values(languageGroups).sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
        );

        console.log("Unique languages found:", sortedLanguages.length);

        // If we found languages, use them
        if (sortedLanguages.length > 0) {
          setAvailableLanguages(sortedLanguages);

          // Try to find English as default, or use the first language
          const english = sortedLanguages.find((lang) =>
            lang.languageCode.startsWith("en")
          );
          setSelectedLanguage(english || sortedLanguages[0]);
        } else {
          console.warn("No voices found, using fallback languages");
          // Fallback languages if none are found
          const fallbacks = [
            {
              languageCode: "en-US",
              displayName: "English (US)",
              voices: [{ id: "en-US", name: "Default" }],
            },
            {
              languageCode: "fr-FR",
              displayName: "French",
              voices: [{ id: "fr-FR", name: "Default" }],
            },
            {
              languageCode: "es-ES",
              displayName: "Spanish",
              voices: [{ id: "es-ES", name: "Default" }],
            },
          ];
          setAvailableLanguages(fallbacks);
          setSelectedLanguage(fallbacks[0]);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
        // Fallback languages if there's an error
        const fallbacks = [
          {
            languageCode: "en-US",
            displayName: "English (US)",
            voices: [{ id: "en-US", name: "Default" }],
          },
          {
            languageCode: "fr-FR",
            displayName: "French",
            voices: [{ id: "fr-FR", name: "Default" }],
          },
          {
            languageCode: "es-ES",
            displayName: "Spanish",
            voices: [{ id: "es-ES", name: "Default" }],
          },
        ];
        setAvailableLanguages(fallbacks);
        setSelectedLanguage(fallbacks[0]);
      } finally {
        setIsLoading(false);
      }
    };

    getAllVoices();

    // Clean up speech when component unmounts
    return () => {
      Speech.stop();
    };
  }, []);

  // Helper function to get a display name from language code
  const getDisplayName = (languageCode) => {
    // Map of language codes to display names
    const languageMap = {
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "es-ES": "Spanish (Spain)",
      "es-MX": "Spanish (Mexico)",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "pt-BR": "Portuguese (Brazil)",
      "ru-RU": "Russian",
      "zh-CN": "Chinese (Simplified)",
      "zh-TW": "Chinese (Traditional)",
      "ar-SA": "Arabic",
      "hi-IN": "Hindi",
      "id-ID": "Indonesian",
      "nl-NL": "Dutch",
      "pl-PL": "Polish",
      "sv-SE": "Swedish",
      "tr-TR": "Turkish",
      "cs-CZ": "Czech",
      "da-DK": "Danish",
      "fi-FI": "Finnish",
      "el-GR": "Greek",
      "he-IL": "Hebrew",
      "hu-HU": "Hungarian",
      "nb-NO": "Norwegian",
      "ro-RO": "Romanian",
      "sk-SK": "Slovak",
      "th-TH": "Thai",
      "vi-VN": "Vietnamese",
    };

    // Try to find the exact match first
    if (languageMap[languageCode]) {
      return languageMap[languageCode];
    }

    // Try to find a base language match (e.g., "en" for "en-AU")
    const baseCode = languageCode.split("-")[0];
    for (const [code, name] of Object.entries(languageMap)) {
      if (code.startsWith(baseCode + "-")) {
        return name;
      }
    }

    // If no match, return the language code itself with proper capitalization
    return languageCode;
  };

  const speak = async () => {
    if (!selectedLanguage) return;

    try {
      // Stop any current speech first
      await Speech.stop();

      // Get the content to speak
      const textToSpeak = data || noteContent || "";

      if (!textToSpeak) {
        console.log("No text to speak");
        return;
      }

      // Select the first voice from the selected language
      const voiceId = selectedLanguage.voices[0].id;
      console.log(
        `Speaking in language: ${selectedLanguage.languageCode} with voice: ${voiceId}`
      );

      const options = {
        language: selectedLanguage.languageCode,
        voice: voiceId,
        pitch: 1.0,
        rate: 1.0,
        onStart: () => {
          console.log("Speech started");
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log("Speech finished");
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log("Speech stopped");
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error("Speech error:", error);
          setIsSpeaking(false);
        },
      };

      await Speech.speak(textToSpeak, options);
    } catch (error) {
      console.error("Error in speak function:", error);
      setIsSpeaking(false);
    }
  };

  const stop = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error("Error in stop function:", error);
    }
  };

  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Note Display Section */}
      <View style={styles.card}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{noteTitle || "Note"}</Text>
          {timestamp && (
            <Text style={styles.noteDate}>
              {new Date(timestamp).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.noteContentContainer}>
          <Text style={styles.noteContent}>{data || noteContent || ""}</Text>
        </View>

        {/* Language Selection - Custom Dropdown */}
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Select Language:</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading languages...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setModalVisible(true)}
              testID="language-selector"
            >
              <Text style={styles.languageSelectorText}>
                {selectedLanguage?.displayName || "Select a language"}
              </Text>
              <View style={styles.selectorInfo}>
                <Text style={styles.voiceCount}>
                  {selectedLanguage
                    ? `${selectedLanguage.voices.length} voice${
                        selectedLanguage.voices.length !== 1 ? "s" : ""
                      }`
                    : ""}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#555" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Audio Controls */}
        <View style={styles.audioControls}>
          {!isSpeaking ? (
            <TouchableOpacity
              onPress={speak}
              style={styles.playButton}
              testID="speak-button"
              disabled={isLoading || !selectedLanguage}
            >
              <Ionicons
                name="play"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Speak</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={stop}
              style={styles.stopButton}
              testID="stop-button"
            >
              <Ionicons
                name="stop"
                size={20}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: "#fff" }}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Available Languages ({availableLanguages.length})
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.languageCode}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage?.languageCode === item.languageCode &&
                      styles.selectedLanguageItem,
                  ]}
                  onPress={() => selectLanguage(item)}
                  testID={`language-option-${item.languageCode}`}
                >
                  <View>
                    <Text
                      style={[
                        styles.languageItemText,
                        selectedLanguage?.languageCode === item.languageCode &&
                          styles.selectedLanguageItemText,
                      ]}
                    >
                      {item.displayName}
                    </Text>
                    <Text style={styles.languageCodeText}>
                      {item.languageCode} · {item.voices.length} voice
                      {item.voices.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  {selectedLanguage?.languageCode === item.languageCode && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.backgroundLight,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
    padding: 16,
  },
  noteHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 14,
    color: "#888",
  },
  noteContentContainer: {
    minHeight: 120,
    marginBottom: 16,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingText: {
    marginLeft: 8,
    color: "#555",
  },
  languageSelector: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageSelectorText: {
    fontSize: 16,
    color: "#333",
  },
  selectorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceCount: {
    fontSize: 12,
    color: "#888",
    marginRight: 8,
  },
  audioControls: {
    marginTop: 16,
    alignItems: "center",
  },
  playButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  stopButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  languageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedLanguageItem: {
    backgroundColor: "#f0f8ff",
  },
  languageItemText: {
    fontSize: 16,
  },
  selectedLanguageItemText: {
    fontWeight: "bold",
    color: Colors.primary,
  },
  languageCodeText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
});

export default TextToSpeech;
