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
  Clipboard,
  ToastAndroid,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { createClient } from "@supabase/supabase-js";
import { Colors } from "@/styles/Colors";
import { Buffer } from "buffer"; // Import Buffer for base64 handling
import { router, useLocalSearchParams } from "expo-router";
import { IpAddressBackend } from "@/IpBackendReturn";
import Button from "@/components/Button";
import { db, collection } from "@/firebaseConfig";
import { addDoc } from "firebase/firestore";

// Initialize Supabase client with your credentials
const SUPABASE_URL = "https://kmvtuzizvvrqowaxaqfh.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdnR1eml6dnZycW93YXhhcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTYyMDEsImV4cCI6MjA2MTA5MjIwMX0.c1gtmPKJU8K_0-S5zZXqnKPCSCJIndsFdyhqOHbPWsA";
const SUPABASE_BUCKET = "prepase2bucket";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function ImageToNotes() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publicUrl, setPublicUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { username } = useLocalSearchParams();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("default"); // default, loading, success, issue

  // New state for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // New state for keyboard visibility
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    console.log("Image To Note ", username);
  }, [username]);

  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Request to extract text from image
  const makeExtractRequest = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`http://${IpAddressBackend}:5000/extract-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: publicUrl,
        }),
      });
      if (!res.ok) {
        throw new Error("Error While Extracting Text");
      }
      const data = await res.json();
      if (data.status != "pass") {
        throw new Error("Our Extracting API Failed");
      }
      setText(data.extracted_text);
      console.log("Extracted Text:-", data.extracted_text);
      setStatus("success");
    } catch (error) {
      setStatus("issue");
      console.error(error);
      setText("");
    }
  };

  useEffect(() => {
    if (publicUrl) {
      console.log("extracting text for ", publicUrl);
      makeExtractRequest();
    }
  }, [publicUrl]);

  const pickImage = async () => {
    try {
      // Reset states
      setError(null);
      setLoading(true);
      setPublicUrl(null);
      setUploadStatus(null);
      setText("");
      setStatus("default");

      // Request permission for media library
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access media library is required!");
          setLoading(false);
          return;
        }
      }

      // Launch image picker with compatible options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      // Handle image selection
      if (!result.canceled) {
        setImage(result.assets[0]);
        // Log the image path
        console.log("Image URI:", result.assets[0].uri);
        console.log("Image Width:", result.assets[0].width);
        console.log("Image Height:", result.assets[0].height);
        console.log("Image Type:", result.assets[0].type);

        // Upload the image to Supabase
        await uploadImageToSupabase(result.assets[0].uri);
      }
    } catch (e) {
      console.error("Error picking image:", e);
      setError(`Error picking image: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to upload image to Supabase and get public URL
  const uploadImageToSupabase = async (localUri) => {
    try {
      setUploadStatus("Uploading to Supabase...");

      // Generate a unique filename
      const uniqueId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const fileName = `diagram_${uniqueId}.png`;

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
        .upload(fileName, decode(base64), {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading:", uploadError);
        setError(`Upload error: ${uploadError.message}`);
        setUploadStatus("Upload failed");
        return null;
      }

      // Get the public URL
      const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName)
        .data.publicUrl;

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

  // Helper function to decode base64 - Using Buffer
  function decode(base64) {
    return Buffer.from(base64, "base64");
  }

  // Function to copy text to clipboard and show notification
  const copyToClipboard = (textToCopy, contentType) => {
    Clipboard.setString(textToCopy);

    // Show notification based on platform
    if (Platform.OS === "android") {
      ToastAndroid.show(
        `${contentType} copied to clipboard!`,
        ToastAndroid.SHORT
      );
    } else {
      Alert.alert("Copied", `${contentType} copied to clipboard!`);
    }
  };

  // Function to handle adding note
  const handleAddNote = async () => {
    if (!noteTitle.trim()) {
      // Show alert if title is empty
      Alert.alert("Error", "Please provide a note title");
      return;
    }

    setAddingNote(true);

    // Log the title and extracted text
    console.log("Adding note with title:", noteTitle);
    console.log("Note content:", text);

    try {
      const collectionRef = collection(db, `users/${username}/notes`);
      console.log(`users/${username}/notes`);
      const timestamp = new Date().toISOString();

      // Add document to Firestore
      const docRef = await addDoc(collectionRef, {
        noteTitle: noteTitle.trim(),
        noteContent: text.trim(), // Use text state instead of noteContent
        timeStamp: timestamp,
      });

      console.log("Document added with ID: ", docRef.id);

      // Show success message
      if (Platform.OS === "android") {
        ToastAndroid.show("Note added successfully!", ToastAndroid.SHORT);
      } else {
        Alert.alert("Success", "Note added successfully!");
      }

      // Close modal and reset states
      setModalVisible(false);
      setNoteTitle("");
      setTimeout(() => {
        router.replace({
          pathname: "/(dashboard)/MainDashboard",
          params: { username },
        });
      }, 1000);
    } catch (error) {
      console.error("Error adding note:", error);
      Alert.alert("Error", "Failed to add note. Please try again.");
    } finally {
      setAddingNote(false);
    }
  };

  // Function to render loading indicators
  const renderLoadingIndicator = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Selecting image...</Text>
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

    if (status === "loading") {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Extracting text...</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />
      <Text style={styles.title}>Image to Notes</Text>

      <View style={styles.uploadContainer}>
        <View style={styles.dragDropArea}>
          {!image ? (
            <>
              <Image
                source={require("../../../images/imagetonote.png")}
                style={styles.folderIcon}
              />
              <Text style={styles.dragDropText}>Drag & Drop</Text>
              <Text style={styles.uploadHelp}>Upload only png, jpg, jpeg</Text>
            </>
          ) : (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, loading && styles.disabledButton]}
          onPress={pickImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.uploadButtonText}>Select Image</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {renderLoadingIndicator()}

      {/* Only render result container when not in a loading state */}
      {image &&
        !error &&
        !loading &&
        status !== "loading" &&
        uploadStatus !== "Uploading to Supabase..." && (
          <View style={styles.resultContainer}>
            {/* Only show issue status message if there's an issue */}
            {status === "issue" && (
              <Text style={styles.errorText}>
                Failed to extract text. Please try again.
              </Text>
            )}

            {/* Extracted Text - Shown First */}
            {text && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionLabel}>Extracted Text:</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.extractedText} selectable>
                    {text}
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title={"Copy"}
                    onPress={() => copyToClipboard(text, "Text")}
                  />
                  <Button
                    title={"Add to my notes"}
                    onPress={() => setModalVisible(true)}
                  />
                </View>
              </>
            )}

            {/* Local Image Path - Shown Second */}
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionLabel}>Local Image Path:</Text>
            </View>
            <View style={styles.urlContainer}>
              <Text style={styles.urlText} selectable>
                {image.uri}
              </Text>
            </View>

            {/* Supabase Public URL - Shown Last */}
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

      {/* Add to Notes Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to My Notes</Text>

            <Text style={styles.modalLabel}>Note Title:</Text>
            <TextInput
              style={styles.titleInput}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Enter note title"
              placeholderTextColor="#999"
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
            />

            {/* Show note content and buttons only when keyboard is not visible */}
            {!keyboardVisible && (
              <>
                <Text style={styles.modalLabel}>Note Content:</Text>
                <View style={styles.noteContentContainer}>
                  <ScrollView style={styles.noteTextScroll}>
                    <Text style={styles.noteText}>{text}</Text>
                  </ScrollView>
                </View>

                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      setNoteTitle("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      addingNote && styles.disabledButton,
                    ]}
                    onPress={handleAddNote}
                    disabled={addingNote}
                  >
                    {addingNote ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.addButtonText}>Add</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
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
  uploadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#a99bc1",
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  previewImage: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
    borderRadius: 8,
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
    color: Colors.primary,
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
    marginBottom: 40,
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
  buttonContainer: {
    flexDirection: "col",
    marginBottom: 40,
  },
  copyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  addToNotesButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  copyButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 12,
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
  textContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 15,
    maxHeight: 300,
  },
  extractedText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  noteContentContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    height: 200,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  noteTextScroll: {
    flex: 1,
  },
  noteText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
