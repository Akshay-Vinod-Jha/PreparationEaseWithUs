import {
  Text,
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ToastAndroid,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { IpAddressBackend } from "@/IpBackendReturn";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Colors } from "@/styles/Colors";
export default function VisualizeNotes() {
  const { noteTitle, noteContent, timestamp, id, username } =
    useLocalSearchParams();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("default");
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullNoteContent, setShowFullNoteContent] = useState(false);
  const [imageRatio, setImageRatio] = useState(1);
  const [mediaPermission, setMediaPermission] = useState(null);
  const [translatedText, setTranslatedText] = useState("");
  const previewLength = 150; // Number of characters to show in preview mode
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (noteTitle && noteContent && timestamp && id && username) {
      console.log(id, timestamp, noteTitle, noteContent);
    }
    getUrl();

    // Request media library permissions for downloading
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(status === "granted");
    })();
  }, [noteTitle, noteContent, timestamp, id, username]);

  // Calculate image dimensions when url changes
  useEffect(() => {
    if (url && status === "success") {
      // Preload the image to get its dimensions
      Image.getSize(
        url,
        (width, height) => {
          setImageRatio(width / height);
        },
        (error) => {
          console.error("Error getting image size:", error);
        }
      );
    }
  }, [url, status]);

  const getUrl = async () => {
    try {
      setStatus("loading");

      // First translate the text
      const res1 = await fetch(`http://${IpAddressBackend}:5000/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: noteContent,
          target_language: "en",
        }),
      });

      const data1 = await res1.json();
      let textForDiagram = noteContent; // Default to original text

      if (data1.status === "pass") {
        setTranslatedText(data1.translated_text);
        textForDiagram = data1.translated_text; // Use translated text for diagram
        console.log(data1.translated_text, " translated note ");
      } else {
        console.log("Translation failed, using original text");
      }

      // Then generate the diagram using the translated text
      const res = await fetch(
        `http://${IpAddressBackend}:5000/generate-diagram`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: textForDiagram }), // Use translated text here
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.status === "pass" || data.status === "success") {
        console.log(data.image_url);
        setUrl(data.image_url);
        setStatus("success");
      } else {
        throw new Error("API returned failure status");
      }
    } catch (error) {
      console.error("Error generating diagram:", error.message);
      setStatus("issue");
      setErrorMessage(error.message || "Failed to generate diagram");
      setUrl("");
    }
  };

  const toggleShowMoreNoteContent = () => {
    setShowFullNoteContent(!showFullNoteContent);
  };

  const getDisplayNoteContent = () => {
    if (showFullNoteContent || noteContent.length <= previewLength) {
      return noteContent;
    }
    return noteContent.substring(0, previewLength) + "...";
  };

  const shouldShowNoteToggle =
    noteContent && noteContent.length > previewLength;

  const downloadImage = async () => {
    try {
      // Generate a file name based on the note title
      const fileName = `diagram_${id || "image"}.png`;

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        const downloadResumable = FileSystem.createDownloadResumable(
          url,
          FileSystem.documentDirectory + fileName
        );

        const { uri } = await downloadResumable.downloadAsync();

        if (Platform.OS === "android") {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync("Downloads", asset, false);
          ToastAndroid.show("Image saved to gallery", ToastAndroid.SHORT);
        } else {
          await Sharing.shareAsync(uri);
        }
      } else {
        // Fallback for platforms where sharing isn't available
        if (Platform.OS === "android" && mediaPermission) {
          const localFile = `${FileSystem.documentDirectory}${fileName}`;
          const downloadResult = await FileSystem.downloadAsync(url, localFile);

          if (downloadResult.status === 200) {
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            await MediaLibrary.createAlbumAsync("Downloads", asset, false);
            ToastAndroid.show("Image saved to gallery", ToastAndroid.SHORT);
          }
        } else {
          ToastAndroid.show("Couldn't download image", ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      ToastAndroid.show("Failed to download image", ToastAndroid.SHORT);
    }
  };

  const retryGeneration = () => {
    getUrl();
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Generating diagram...</Text>
            <Text style={styles.loadingSubtext}>
              Analyzing note content and creating visual representation
            </Text>
          </View>
        );
      case "success":
        return (
          <View style={styles.resultContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: url }}
                style={[
                  styles.diagramImage,
                  {
                    width: screenWidth - 64,
                    height: (screenWidth - 64) / imageRatio,
                    aspectRatio: imageRatio,
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadImage}
              activeOpacity={0.7}
            >
              <Text style={styles.downloadButtonText}>Download Diagram</Text>
            </TouchableOpacity>
          </View>
        );
      case "issue":
        return (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color="#f44336" />
            <Text style={styles.errorTitle}>Diagram Generation Failed</Text>
            <Text style={styles.errorMessage}>
              {errorMessage ||
                "Something went wrong while creating your diagram"}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryGeneration}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.defaultContainer}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.defaultText}>
              Preparing to visualize your note...
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
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
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

        <View style={styles.visualizationSection}>
          <View style={styles.visualizationHeader}>
            <Text style={styles.visualizationTitle}>Note Visualization</Text>
          </View>
          <View style={styles.visualizationCard}>{renderContent()}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6E0F8",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  visualizationSection: {
    marginBottom: 40,
  },
  visualizationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  visualizationCard: {
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
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8ff",
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  diagramImage: {
    backgroundColor: "#f8f8ff",
  },
  downloadButton: {
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
  downloadButtonText: {
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
});
