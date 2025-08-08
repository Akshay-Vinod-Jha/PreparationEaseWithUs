import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { db, collection, getDocs } from "@/firebaseConfig";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { createClient } from "@supabase/supabase-js";
import { Colors } from "@/styles/Colors";
import { Buffer } from "buffer"; // Import Buffer for base64 handling
import { router, useLocalSearchParams } from "expo-router";
import { addDoc } from "firebase/firestore";
// Initialize Supabase client with your credentials
const SUPABASE_URL = "https://kmvtuzizvvrqowaxaqfh.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdnR1eml6dnZycW93YXhhcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTYyMDEsImV4cCI6MjA2MTA5MjIwMX0.c1gtmPKJU8K_0-S5zZXqnKPCSCJIndsFdyhqOHbPWsA";
const SUPABASE_BUCKET = "prepase2bucket";
const SUPABASE_FONTS_PATH = "fonts/";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function FontUploader() {
  const [fontFile, setFontFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publicUrl, setPublicUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [ttf, setTtf] = useState([]);
  const [statusttf, setStatusTTf] = useState("default"); //status to define getting
  const [ttfTitle, setTtfTitle] = useState("");
  const [addingStatus, setAddingStatus] = useState("default"); //status for adding
  const { username, data } = useLocalSearchParams();

  useEffect(() => {
    console.log("handwritting one ", username);
    // Load TTF files on component mount
    getallttf();
  }, [username]);

  const getallttf = async () => {
    setStatusTTf("loading");
    try {
      const collectionRef = collection(db, `users/${username}/ttf`);
      const snapshot = await getDocs(collectionRef);
      const ttfdata = snapshot.docs.map((val) => ({
        id: val.id,
        ...val.data(),
      }));
      setTtf(ttfdata);
      setStatusTTf("success");
    } catch (error) {
      console.error("Error fetching TTF files:", error);
      setTtf([]);
      setStatusTTf("issue");
    }
  };

  const addttf = async () => {
    if (!ttfTitle.trim()) {
      Alert.alert("Error", "Please enter a title for your font file");
      return;
    }

    if (!publicUrl) {
      Alert.alert("Error", "Please upload a font file first");
      return;
    }

    setAddingStatus("loading");
    try {
      const collectionRef = collection(db, `users/${username}/ttf`);
      const ctimestamp = new Date().toISOString();
      const data = await addDoc(collectionRef, {
        title: ttfTitle,
        link: publicUrl,
        timeStamp: ctimestamp,
      });
      setTtf((prevTtf) => [
        {
          id: data.id,
          title: ttfTitle,
          link: publicUrl,
          timeStamp: ctimestamp,
        },
        ...prevTtf,
      ]);
      setAddingStatus("success");
      setTtfTitle(""); // Clear title field
      setPublicUrl(null); // Clear URL
      setFontFile(null); // Clear file selection
      Alert.alert("Success", "Font file added successfully!");
    } catch (error) {
      console.error("Error adding TTF file:", error);
      setAddingStatus("issue");
      Alert.alert("Error", "Failed to add font to your collection");
    }
  };

  const pickFontFile = async () => {
    try {
      // Reset states
      setError(null);
      setLoading(true);
      setPublicUrl(null);
      setUploadStatus(null);

      // Launch document picker to select TTF files
      const result = await DocumentPicker.getDocumentAsync({
        type: "font/ttf", // Specify TTF mime type
        copyToCacheDirectory: true, // Ensure we can access the file
      });

      // Handle file selection
      if (result.canceled === false) {
        setFontFile(result.assets[0]);
        // Log the file details
        console.log("Font File URI:", result.assets[0].uri);
        console.log("Font File Name:", result.assets[0].name);
        console.log("Font File Size:", result.assets[0].size);
        console.log("Font File Type:", result.assets[0].mimeType);

        // Upload the font file to Supabase
        await uploadFontToSupabase(result.assets[0].uri, result.assets[0].name);
      }
    } catch (e) {
      console.error("Error picking font file:", e);
      setError(`Error picking font file: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to upload font file to Supabase and get public URL
  const uploadFontToSupabase = async (localUri, fileName) => {
    try {
      setUploadStatus("Uploading to Supabase...");

      // Generate a unique filename but keep the original name and extension
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const originalName = fileName || "font.ttf";
      const sanitizedName = originalName.replace(/[^\w.-]/g, "_"); // Remove special chars
      const uniqueFileName = `${SUPABASE_FONTS_PATH}font_${uniqueId}_${sanitizedName}`; // Add fonts/ directory path

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        setError("File doesn't exist");
        setUploadStatus("Upload failed");
        return null;
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload using binary data converted from base64
      const { data, error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(uniqueFileName, decode(base64), {
          contentType: "font/ttf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading:", uploadError);
        setError(`Upload error: ${uploadError.message}`);
        setUploadStatus("Upload failed");
        return null;
      }

      // Get the public URL
      const url = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(uniqueFileName).data.publicUrl;

      console.log("Public URL:", url);
      setPublicUrl(url);
      setUploadStatus(null); // Hide upload status after successful upload
      return url;
    } catch (e) {
      console.error("Error in upload process:", e);
      setError(`Upload process error: ${e.message}`);
      setUploadStatus("Upload failed");
      return null;
    }
  };

  // Handler for TTF item click
  const handleTTFItemClick = (item) => {
    console.log("TTF Item Clicked:", item);
    router.push({
      pathname: "/(tools)/(texttohand)/PageToConvertToImage",
      params: { ...item, data },
    });
    // You can add more functionality here like showing a modal with details,
    // copying the URL to clipboard, or setting it as the current font
  };

  // Helper function to decode base64 - Using Buffer
  function decode(base64) {
    return Buffer.from(base64, "base64");
  }

  // Function to render loading indicators
  const renderLoadingIndicator = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Selecting font file...</Text>
        </View>
      );
    }

    if (uploadStatus && uploadStatus.includes("Uploading")) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{uploadStatus}</Text>
        </View>
      );
    }

    return null;
  };

  // Render a TTF file item
  const renderTTFItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ttfItem}
      onPress={() => handleTTFItemClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.ttfInfoContainer}>
        <Text style={styles.ttfTitle}>{item.title}</Text>
        <Text style={styles.ttfDate}>
          {new Date(item.timeStamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.ttfUrlContainer}>
        <Text style={styles.ttfUrl} numberOfLines={1} ellipsizeMode="middle">
          {item.link}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />
      <Text style={styles.title}>Font Uploader</Text>

      <View style={styles.uploadContainer}>
        <View style={styles.dragDropArea}>
          {!fontFile ? (
            <>
              <Image
                source={require("../../../images/imagetonote.png")}
                style={styles.folderIcon}
              />
              <Text style={styles.dragDropText}>Drag & Drop</Text>
              <Text style={styles.uploadHelp}>Upload only TTF font files</Text>
            </>
          ) : (
            <View style={styles.filePreview}>
              <Text style={styles.fileNameText}>{fontFile.name}</Text>
              <Text style={styles.fileSizeText}>
                {(fontFile.size / 1024).toFixed(2)} KB
              </Text>
            </View>
          )}
        </View>

        {/* Add title input field */}
        <View style={styles.titleInputContainer}>
          <Text style={styles.inputLabel}>Font Title:</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Enter a title for your font"
            value={ttfTitle}
            onChangeText={setTtfTitle}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              styles.selectButton,
              loading && styles.disabledButton,
            ]}
            onPress={pickFontFile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.uploadButtonText}>Select Font</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              styles.saveButton,
              addingStatus === "loading" && styles.disabledButton,
              (!fontFile || !publicUrl) && styles.disabledButton,
            ]}
            onPress={addttf}
            disabled={addingStatus === "loading" || !fontFile || !publicUrl}
          >
            {addingStatus === "loading" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.uploadButtonText}>Save Font</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {renderLoadingIndicator()}

      {/* Results container */}
      {fontFile &&
        !error &&
        !loading &&
        uploadStatus !== "Uploading to Supabase..." && (
          <View style={styles.resultContainer}>
            {/* Local File Path */}
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionLabel}>Local File Path:</Text>
            </View>
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} selectable>
                {fontFile.uri}
              </Text>
            </View>

            {/* Supabase Public URL */}
            {publicUrl && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionLabel}>Supabase Public URL:</Text>
                </View>
                <View style={styles.urlContainer}>
                  <Text style={styles.urlText} selectable>
                    {publicUrl}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

      {/* TTF Files List */}
      <View style={styles.ttfListContainer}>
        <View style={styles.ttfListHeader}>
          <Text style={styles.ttfListTitle}>Your Font Collection</Text>
          {statusttf === "loading" && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>

        {statusttf === "issue" && (
          <Text style={styles.errorText}>Failed to load your fonts</Text>
        )}

        {statusttf === "success" && ttf.length === 0 && (
          <Text style={styles.emptyText}>
            No fonts added yet. Upload your first font!
          </Text>
        )}

        {ttf.length > 0 && (
          <FlatList
            data={ttf}
            renderItem={renderTTFItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // Disable scrolling within FlatList since it's inside ScrollView
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.backgroundLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginVertical: 20,
  },
  uploadContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  dragDropArea: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
  },
  folderIcon: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  dragDropText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  uploadHelp: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  filePreview: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  fileSizeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  titleInputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  titleInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  uploadButton: {
    backgroundColor: "#7858a6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButton: {
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#5cb85c",
  },
  disabledButton: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  loadingText: {
    color: "#7858a6",
    marginTop: 10,
    fontWeight: "500",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  urlContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
  },
  urlText: {
    color: "#333",
    fontSize: 12,
  },
  ttfListContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    marginBottom: 40,
  },
  ttfListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  ttfListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: 20,
  },
  ttfItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  ttfInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ttfTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  ttfDate: {
    fontSize: 12,
    color: "#666",
  },
  ttfUrlContainer: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
  },
  ttfUrl: {
    fontSize: 12,
    color: "#555",
  },
});
