import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { IpAddressBackend } from "@/IpBackendReturn";
import { Colors } from "@/styles/Colors";
// Language code to full name mapping
export const languageMapping = {
  af: "Afrikaans",
  ar: "Arabic",
  bg: "Bulgarian",
  bn: "Bengali",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  gu: "Gujarati",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  kn: "Kannada",
  ko: "Korean",
  lt: "Lithuanian",
  lv: "Latvian",
  mk: "Macedonian",
  ml: "Malayalam",
  mr: "Marathi",
  ne: "Nepali",
  nl: "Dutch",
  no: "Norwegian",
  pa: "Punjabi",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  sq: "Albanian",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tl: "Tagalog",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  vi: "Vietnamese",
  zh: "Chinese",
};

// Function to convert language code to full name
export const getLanguageName = (code) => {
  // Return the full name if found, otherwise return the code
  return languageMapping[code.trim()] || code;
};
export default function DisplayIndNote() {
  const { noteTitle, noteContent, timestamp, id } = useLocalSearchParams();
  const [status, setStatus] = useState("default");
  const [response, setResponse] = useState(null);
  const [probableLanguages, setProbableLanguages] = useState([]);

  const detectLang = async () => {
    console.log("Start detecting language...");
    setStatus("loading");

    try {
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

      const data = await res.json();

      if (data.status === "pass") {
        setResponse({
          language: data.language,
          languageName: getLanguageName(data.language),
        });

        const parsedProbableLanguages = data.probable_languages
          .replace(/\[|\]/g, "")
          .split(",")
          .map((item) => {
            const [lang, prob] = item.split(":");
            const trimmedLang = lang.trim();
            return {
              language: trimmedLang,
              languageName: getLanguageName(trimmedLang),
              probability: parseFloat(prob).toFixed(4),
            };
          });

        setProbableLanguages(parsedProbableLanguages);
        setStatus("success");
      } else {
        setResponse(null);
        setProbableLanguages([]);
        setStatus("issue");
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setStatus("issue");
    }

    console.log("End detecting language...");
  };

  useEffect(() => {
    if (noteTitle && noteContent && timestamp && id) {
      console.log("Fetching data for:", id, noteTitle, noteContent, timestamp);
      detectLang();
    }
  }, [noteTitle, noteContent, timestamp, id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <Text style={styles.header}>Detected Language</Text>

        {/* Status Handling */}
        {status === "loading" && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5D4A7E" />
            <Text style={styles.loadingText}>Analyzing text...</Text>
          </View>
        )}

        {status === "issue" && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to detect language</Text>
            <TouchableOpacity style={styles.retryButton} onPress={detectLang}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "success" && response && (
          <>
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Detected Language</Text>
              <Text style={styles.detectedLang}>{response.languageName}</Text>
              <Text style={styles.langCode}>({response.language})</Text>
            </View>

            {/* Note Information */}
            <View style={styles.noteContainer}>
              <View style={styles.noteMeta}>
                <Text style={styles.noteTitle}>{noteTitle}</Text>
                <Text style={styles.timestamp}>{timestamp}</Text>
              </View>
              <Text style={styles.noteContent}>{noteContent}</Text>
            </View>

            <Text style={styles.sectionHeader}>Analysis Results</Text>

            {/* Probable Languages List */}
            {probableLanguages.map((item, index) => (
              <View key={index} style={styles.languageItem}>
                <View style={styles.languageHeader}>
                  <Text style={styles.languageText}>{item.languageName}</Text>
                  <Text style={styles.languageCode}>({item.language})</Text>
                </View>
                <View style={styles.probabilityContainer}>
                  <View
                    style={[
                      styles.probabilityBar,
                      { width: `${parseFloat(item.probability) * 100}%` },
                    ]}
                  />
                  <Text style={styles.probabilityText}>{item.probability}</Text>
                </View>
              </View>
            ))}
          </>
        )}
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
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom for better scrolling
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#F8F0F0",
    borderRadius: 10,
    padding: 24,
    marginTop: 20,
  },
  errorText: {
    color: "#C62828",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  detectedLang: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
  },
  langCode: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  noteContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2E2E",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
  },
  noteContent: {
    fontSize: 16,
    color: "#444",
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 16,
  },
  languageItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  languageCode: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },
  probabilityContainer: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    position: "relative",
    marginTop: 12,
  },
  probabilityBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  probabilityText: {
    position: "absolute",
    right: 0,
    top: -20,
    fontSize: 12,
    color: "#666",
  },
});
