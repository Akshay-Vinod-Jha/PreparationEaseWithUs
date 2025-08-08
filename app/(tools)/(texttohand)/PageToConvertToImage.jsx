import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  ToastAndroid,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IpAddressBackend } from "@/IpBackendReturn";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { MaterialIcons } from "@expo/vector-icons";

// Color palette
export const Colors = {
  primary: "#735DA5", // Purple color from the image
  accent: "#735DA5", // Darker shade of purple for links
  backgroundLight: "#F6F5FA", // Light background color
  white: "#FFFFFF",
  textDark: "#333333",
  textLight: "#FFFFFF",
  placeholder: "#AAAAAA",
  disabled: "#CCCCCC",
};

export default function PageToConvertToImage() {
  const { id, title, link, timeStamp, data } = useLocalSearchParams();
  const [status, setStatus] = useState("default");
  const [purl, setpurl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [mediaPermission, setMediaPermission] = useState(false);

  // Request media permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(status === "granted");
      }
    })();
  }, []);

  const getPublicUrl = async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `http://${IpAddressBackend}:5000/generate-handwriting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: data,
            ttf_url: link,
          }),
        }
      );
      const responseData = await res.json();
      if (responseData.status !== "pass") {
        throw new Error("API Failed For Handwriting");
      }
      setpurl(responseData.file_url);
      setStatus("success");
    } catch (error) {
      console.error("Error generating handwriting:", error);
      setStatus("issue");
      setpurl("");
    }
  };

  // Call API on component mount
  useEffect(() => {
    getPublicUrl();
  }, []);

  // Handle image download using provided code
  const downloadImage = async () => {
    if (!purl) return;

    setDownloadStatus("downloading");

    try {
      // Generate a file name based on the note title
      const fileName = `handwriting_${id || "image"}.png`;

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        const downloadResumable = FileSystem.createDownloadResumable(
          purl,
          FileSystem.documentDirectory + fileName
        );

        const { uri } = await downloadResumable.downloadAsync();

        if (Platform.OS === "android") {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync("Downloads", asset, false);
          ToastAndroid.show("Image saved to gallery", ToastAndroid.SHORT);
          setDownloadStatus("success");
        } else {
          await Sharing.shareAsync(uri);
          setDownloadStatus("success");
        }
      } else {
        // Fallback for platforms where sharing isn't available
        if (Platform.OS === "android" && mediaPermission) {
          const localFile = `${FileSystem.documentDirectory}${fileName}`;
          const downloadResult = await FileSystem.downloadAsync(
            purl,
            localFile
          );

          if (downloadResult.status === 200) {
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            await MediaLibrary.createAlbumAsync("Downloads", asset, false);
            ToastAndroid.show("Image saved to gallery", ToastAndroid.SHORT);
            setDownloadStatus("success");
          }
        } else {
          ToastAndroid.show("Couldn't download image", ToastAndroid.SHORT);
          setDownloadStatus("error");
        }
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      if (Platform.OS === "android") {
        ToastAndroid.show("Failed to download image", ToastAndroid.SHORT);
      }
      setDownloadStatus("error");
    } finally {
      // Reset download status after 3 seconds
      setTimeout(() => setDownloadStatus(""), 3000);
    }
  };

  // Handle image sharing
  const shareImage = async () => {
    if (!purl) return;

    try {
      // Create a temporary file for sharing
      const fileName = `handwriting_temp_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Download to cache first
      const downloadResult = await FileSystem.downloadAsync(purl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error("Download for sharing failed");
      }

      // Share the file
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Sharing error:", error);
      if (Platform.OS === "android") {
        ToastAndroid.show("Failed to share image", ToastAndroid.SHORT);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Note Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note Content:</Text>
          <View style={styles.card}>
            <Text style={styles.noteText}>{data}</Text>
          </View>
        </View>

        {/* Font Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Information:</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Font Name:</Text>
              <Text style={styles.infoValue}>{title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Font ID:</Text>
              <Text style={styles.infoValue}>{id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Added:</Text>
              <Text style={styles.infoValue}>
                {new Date(timeStamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TTF URL:</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {link}
              </Text>
            </View>
          </View>
        </View>

        {/* Status and Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handwriting Image:</Text>

          {status === "default" && (
            <View style={styles.card}>
              <Text style={styles.statusText}>
                Ready to generate handwriting image...
              </Text>
            </View>
          )}

          {status === "loading" && (
            <View style={[styles.card, styles.centerContent]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.statusText, styles.loadingText]}>
                Generating handwriting image...
              </Text>
            </View>
          )}

          {status === "issue" && (
            <View style={[styles.card, styles.errorCard]}>
              <Text style={styles.errorText}>
                Failed to generate handwriting image. Please try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={getPublicUrl}
              >
                <MaterialIcons
                  name="refresh"
                  size={20}
                  color={Colors.textLight}
                />
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === "success" && purl && (
            <View style={styles.card}>
              <Image source={{ uri: purl }} style={styles.handwritingImage} />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    downloadStatus === "downloading" && styles.buttonDisabled,
                  ]}
                  onPress={downloadImage}
                  disabled={downloadStatus === "downloading"}
                >
                  {downloadStatus === "downloading" ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={Colors.textLight}
                      />
                      <Text style={styles.buttonText}>Downloading...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons
                        name={
                          downloadStatus === "success"
                            ? "check"
                            : "file-download"
                        }
                        size={20}
                        color={Colors.textLight}
                      />
                      <Text style={styles.buttonText}>
                        {downloadStatus === "success"
                          ? "Saved to Gallery"
                          : "Download"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareImage}
                >
                  <MaterialIcons
                    name="share"
                    size={20}
                    color={Colors.textLight}
                  />
                  <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textDark,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    width: 100,
    color: Colors.primary,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
    color: Colors.textDark,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  statusText: {
    fontSize: 16,
    color: Colors.placeholder,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.primary,
  },
  errorCard: {
    backgroundColor: "#FFF8F8",
    borderLeftWidth: 4,
    borderLeftColor: "#E74C3C",
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  shareButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.textLight,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  handwritingImage: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    borderRadius: 4,
  },
});
