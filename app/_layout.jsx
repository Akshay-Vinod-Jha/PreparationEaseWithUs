import { Stack } from "expo-router";
import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Text,
  Alert,
  ScrollView,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/styles/Colors";

// Fallback data for testing when API is unavailable
const FALLBACK_DATA = {
  word: "example",
  phonetic: "/ɪɡˈzɑːmpəl/",
  meanings: [
    {
      partOfSpeech: "noun",
      definitions: [
        {
          definition: "A representative form or pattern",
          example: "I followed your example and submitted my application",
        },
        {
          definition:
            "Something that serves as a pattern of behavior to be imitated",
          example: "She was an example to the younger employees",
        },
      ],
    },
    {
      partOfSpeech: "verb",
      definitions: [
        {
          definition: "To give or be an example of",
          example:
            "The teacher exampled the use of the word in various sentences",
        },
      ],
    },
  ],
  synonyms: ["instance", "sample", "illustration", "case"],
  antonyms: ["counterexample"],
};

export default function RootLayout() {
  const [showSearchField, setShowSearchField] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  // For double click implementation
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  // Navigation indices
  const [currentSynonymIndex, setCurrentSynonymIndex] = useState(0);
  const [currentAntonymIndex, setCurrentAntonymIndex] = useState(0);
  const [currentDefinitionIndex, setCurrentDefinitionIndex] = useState(0);
  const [currentMeaningIndex, setCurrentMeaningIndex] = useState(0);

  // Close search when keyboard is dismissed
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (showSearchField && searchText === "") {
          setShowSearchField(false);
        }
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [showSearchField, searchText]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  // Add loading animation effect
  useEffect(() => {
    if (loading) {
      // Create a pulsing animation for the loading dots
      const interval = setInterval(() => {
        // This forces a re-render which changes the appearance of dots
        setLoading((prevLoading) => {
          if (prevLoading) return prevLoading;
          return true;
        });
      }, 600);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchWordData = async (word) => {
    // Reset previous state
    setLoading(true);
    setError(null);

    try {
      // Check if we're in fallback mode
      if (useFallback) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Use fallback data but change the word to match search
        const mockData = {
          ...FALLBACK_DATA,
          word: word,
        };

        setWordData(mockData);
        return;
      }

      // For better error handling, use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal, // Add abort signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Word not found in dictionary");
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Extract the first result
        const wordEntry = data[0];

        // Extract all synonyms and antonyms from all meanings
        let allSynonyms = [];
        let allAntonyms = [];

        wordEntry.meanings.forEach((meaning) => {
          // Check for synonyms/antonyms at the meaning level
          if (meaning.synonyms && meaning.synonyms.length > 0) {
            allSynonyms = [...allSynonyms, ...meaning.synonyms];
          }

          if (meaning.antonyms && meaning.antonyms.length > 0) {
            allAntonyms = [...allAntonyms, ...meaning.antonyms];
          }

          // Check each definition for synonyms/antonyms
          meaning.definitions.forEach((def) => {
            if (def.synonyms && def.synonyms.length > 0) {
              allSynonyms = [...allSynonyms, ...def.synonyms];
            }
            if (def.antonyms && def.antonyms.length > 0) {
              allAntonyms = [...allAntonyms, ...def.antonyms];
            }
          });
        });

        // Remove duplicates
        allSynonyms = [...new Set(allSynonyms)];
        allAntonyms = [...new Set(allAntonyms)];

        setWordData({
          word: wordEntry.word,
          phonetic: wordEntry.phonetic || "",
          meanings: wordEntry.meanings,
          synonyms: allSynonyms,
          antonyms: allAntonyms,
        });

        // Reset indices
        setCurrentMeaningIndex(0);
        setCurrentDefinitionIndex(0);
        setCurrentSynonymIndex(0);
        setCurrentAntonymIndex(0);
      } else {
        throw new Error("No data available for this word");
      }
    } catch (error) {
      console.error("Error fetching word data:", error);

      if (error.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else if (error.message.includes("Network request failed")) {
        setError("Network error. Check your internet connection.");

        // Offer to use offline mode with improved UI indication
        Alert.alert(
          "Network Error",
          "Unable to connect to dictionary API. Would you like to use offline mode with limited functionality?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Use Offline Mode",
              onPress: () => {
                setUseFallback(true);
                // Try again with fallback
                fetchWordData(word);
              },
            },
          ]
        );
      } else {
        setError(error.message || "Failed to fetch word data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      fetchWordData(searchText.trim().toLowerCase());
    }
  };

  const closeWordData = () => {
    setWordData(null);
  };

  // Switch to online mode function
  const switchToOnlineMode = () => {
    setUseFallback(false);
    setError(null);
    setWordData(null);
  };

  // Handle double tap for search button
  const handleSearchButtonTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms between taps

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (showSearchField) {
        // Close search field on double tap if already open
        setShowSearchField(false);
      } else {
        // Open search field on double tap if closed
        setShowSearchField(true);
      }
      lastTapRef.current = 0; // Reset for next sequence
    } else {
      // First tap - start timer
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap action (optional)
        tapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const navigateMeaning = (direction) => {
    if (wordData && wordData.meanings && wordData.meanings.length > 0) {
      if (direction === "next") {
        setCurrentMeaningIndex((prevIndex) => {
          const newIndex =
            prevIndex < wordData.meanings.length - 1 ? prevIndex + 1 : 0;
          setCurrentDefinitionIndex(0); // Reset definition index when changing meaning
          return newIndex;
        });
      } else {
        setCurrentMeaningIndex((prevIndex) => {
          const newIndex =
            prevIndex > 0 ? prevIndex - 1 : wordData.meanings.length - 1;
          setCurrentDefinitionIndex(0); // Reset definition index when changing meaning
          return newIndex;
        });
      }
    }
  };

  const navigateDefinition = (direction) => {
    if (
      wordData &&
      wordData.meanings &&
      wordData.meanings[currentMeaningIndex] &&
      wordData.meanings[currentMeaningIndex].definitions.length > 0
    ) {
      const definitions = wordData.meanings[currentMeaningIndex].definitions;

      if (direction === "next") {
        setCurrentDefinitionIndex((prevIndex) =>
          prevIndex < definitions.length - 1 ? prevIndex + 1 : 0
        );
      } else {
        setCurrentDefinitionIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : definitions.length - 1
        );
      }
    }
  };

  const navigateSynonym = (direction) => {
    if (wordData && wordData.synonyms && wordData.synonyms.length > 0) {
      if (direction === "next") {
        setCurrentSynonymIndex((prevIndex) =>
          prevIndex < wordData.synonyms.length - 1 ? prevIndex + 1 : 0
        );
      } else {
        setCurrentSynonymIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : wordData.synonyms.length - 1
        );
      }
    }
  };

  const navigateAntonym = (direction) => {
    if (wordData && wordData.antonyms && wordData.antonyms.length > 0) {
      if (direction === "next") {
        setCurrentAntonymIndex((prevIndex) =>
          prevIndex < wordData.antonyms.length - 1 ? prevIndex + 1 : 0
        );
      } else {
        setCurrentAntonymIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : wordData.antonyms.length - 1
        );
      }
    }
  };

  // Get current meaning and definition if available
  const currentMeaning = wordData?.meanings?.[currentMeaningIndex];
  const currentDefinition =
    currentMeaning?.definitions?.[currentDefinitionIndex];

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        style={styles.stack}
      >
        <Stack.Screen
          name="index"
          options={{ title: "PreEase", headerShown: false }}
        />
        <Stack.Screen
          name="details"
          options={{ title: "About", headerShown: false }}
        />
      </Stack>

      {/* Network Status Indicator */}
      {useFallback && (
        <TouchableOpacity
          style={styles.offlineIndicator}
          onPress={switchToOnlineMode}
        >
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </TouchableOpacity>
      )}

      {/* Word Data Results */}
      {wordData && (
        <View style={styles.wordDataContainer}>
          <View style={styles.wordDataHeader}>
            <Text style={styles.wordTitle}>{wordData.word}</Text>
            <TouchableOpacity
              onPress={closeWordData}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.statusContainer}>
              <View style={styles.loadingIndicator}>
                {/* This creates a pulsing effect */}
                <View style={[styles.loadingDot, styles.dot1]} />
                <View style={[styles.loadingDot, styles.dot2]} />
                <View style={[styles.loadingDot, styles.dot3]} />
              </View>
              <Text style={styles.statusText}>
                Looking up "{searchText}"...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.statusContainer}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={32} color="#e74c3c" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
              {!useFallback && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => fetchWordData(searchText)}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color="#fff"
                    style={styles.retryIcon}
                  />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
            >
              <View style={styles.wordDataContent}>
                {/* Phonetic */}
                {wordData.phonetic && (
                  <Text style={styles.phonetic}>{wordData.phonetic}</Text>
                )}

                {/* Part of Speech & Definition */}
                {currentMeaning && currentDefinition && (
                  <View style={styles.section}>
                    <View style={styles.partOfSpeechContainer}>
                      <Text style={styles.partOfSpeech}>
                        {currentMeaning.partOfSpeech}
                      </Text>
                      {wordData.meanings.length > 1 && (
                        <View style={styles.navigationContainer}>
                          <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateMeaning("prev")}
                          >
                            <Ionicons
                              name="chevron-back"
                              size={14}
                              color="#555"
                            />
                          </TouchableOpacity>
                          <Text style={styles.navText}>
                            {currentMeaningIndex + 1}/{wordData.meanings.length}
                          </Text>
                          <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateMeaning("next")}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color="#555"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <Text style={styles.sectionTitle}>Definition:</Text>
                    <View style={styles.definitionContainer}>
                      <Text style={styles.definitionText}>
                        {currentDefinition.definition}
                      </Text>
                      {currentMeaning.definitions.length > 1 && (
                        <View style={styles.navigationContainer}>
                          <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateDefinition("prev")}
                          >
                            <Ionicons
                              name="chevron-back"
                              size={14}
                              color="#555"
                            />
                          </TouchableOpacity>
                          <Text style={styles.navText}>
                            {currentDefinitionIndex + 1}/
                            {currentMeaning.definitions.length}
                          </Text>
                          <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateDefinition("next")}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color="#555"
                            />
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Example usage if available */}
                      {currentDefinition.example && (
                        <View style={styles.exampleContainer}>
                          <Text style={styles.exampleLabel}>Example:</Text>
                          <Text style={styles.exampleText}>
                            "{currentDefinition.example}"
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Synonyms */}
                {wordData.synonyms && wordData.synonyms.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Synonym:</Text>
                    <View style={styles.wordChip}>
                      <Text style={styles.chipText}>
                        {wordData.synonyms[currentSynonymIndex]}
                      </Text>
                    </View>
                    {wordData.synonyms.length > 1 && (
                      <View style={styles.navigationContainer}>
                        <TouchableOpacity
                          style={styles.navButton}
                          onPress={() => navigateSynonym("prev")}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={14}
                            color="#555"
                          />
                        </TouchableOpacity>
                        <Text style={styles.navText}>
                          {currentSynonymIndex + 1}/{wordData.synonyms.length}
                        </Text>
                        <TouchableOpacity
                          style={styles.navButton}
                          onPress={() => navigateSynonym("next")}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#555"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Antonyms */}
                {wordData.antonyms && wordData.antonyms.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Antonym:</Text>
                    <View style={styles.wordChip}>
                      <Text style={styles.chipText}>
                        {wordData.antonyms[currentAntonymIndex]}
                      </Text>
                    </View>
                    {wordData.antonyms.length > 1 && (
                      <View style={styles.navigationContainer}>
                        <TouchableOpacity
                          style={styles.navButton}
                          onPress={() => navigateAntonym("prev")}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={14}
                            color="#555"
                          />
                        </TouchableOpacity>
                        <Text style={styles.navText}>
                          {currentAntonymIndex + 1}/{wordData.antonyms.length}
                        </Text>
                        <TouchableOpacity
                          style={styles.navButton}
                          onPress={() => navigateAntonym("next")}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#555"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {(!currentMeaning || wordData.meanings.length === 0) &&
                  wordData.synonyms.length === 0 &&
                  wordData.antonyms.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search-outline" size={36} color="#999" />
                      <Text style={styles.noDataText}>
                        No information found for "{wordData.word}".
                      </Text>
                      <Text style={styles.suggestionText}>
                        Try checking spelling or search for another word.
                      </Text>
                    </View>
                  )}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Persistent search button or search field */}
      <View style={styles.searchContainer}>
        {showSearchField ? (
          <View style={styles.searchFieldContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search a word..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchButtonTap}
              disabled={loading}
            >
              {loading ? (
                <Ionicons name="hourglass-outline" size={24} color="#fff" />
              ) : (
                <Ionicons name="search" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchButtonTap}
            disabled={loading}
          >
            {loading ? (
              <Ionicons name="hourglass-outline" size={24} color="#fff" />
            ) : (
              <Ionicons name="search" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  stack: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  searchFieldContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 28,
    width: 250,
    height: 56,
    alignItems: "center",
    paddingLeft: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  wordDataContainer: {
    position: "absolute",
    bottom: 90, // Positioned above the search button
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: 280,
    maxHeight: 350,
    zIndex: 100,
  },
  scrollContainer: {
    maxHeight: 290, // Leave room for header
  },
  scrollContentContainer: {
    paddingBottom: 10, // Add some padding at the bottom
  },
  wordDataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  wordTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  wordDataContent: {
    padding: 12,
  },
  phonetic: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  partOfSpeechContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  partOfSpeech: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.primary,
    fontWeight: "600",
  },
  definitionContainer: {
    backgroundColor: "#f8f8f8",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  wordChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 14,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  navButton: {
    padding: 4,
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 4,
  },
  exampleContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#555",
  },
  // Improved status styles
  statusContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  loadingIndicator: {
    flexDirection: "row",
    marginBottom: 12,
    height: 20,
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 3,
  },
  dot1: {
    opacity: 0.6,
    transform: [{ scale: 0.8 }],
  },
  dot2: {
    opacity: 0.8,
    transform: [{ scale: 1 }],
  },
  dot3: {
    opacity: 0.6,
    transform: [{ scale: 0.8 }],
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorIconContainer: {
    marginBottom: 12,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
    color: "#e74c3c",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  retryIcon: {
    marginRight: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noDataText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  suggestionText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    color: "#999",
  },
  offlineIndicator: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#555",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
});
