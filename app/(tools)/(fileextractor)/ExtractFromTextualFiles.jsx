import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { db, collection } from "@/firebaseConfig";
import { addDoc } from "firebase/firestore";
import { Colors } from "@/styles/Colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-js";

// Note: pdf-parse and mammoth are Node.js libraries that don't work directly in React Native
// We'll need different approaches for PDF and DOCX parsing

export default function ExtractFromFiles() {
  const { username } = useLocalSearchParams();
  const [extractedText, setExtractedText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [formStatus, setFormStatus] = useState("default"); //default,success,issue,loading
  const router = useRouter();

  const pickDocument = async () => {
    console.log("function to pick the document");
  };

  const extractPdfContent = () => {
    setExtractedText("Textual PDF Title");
    setNoteContent("Textual PDF Content");
  };

  const extractDocxContent = () => {
    setExtractedText("Textual Word");
    setNoteContent("Textual Content Word");
  };

  const extractTxtContent = () => {
    setExtractedText("Textual Title txt");
    setNoteContent("Textual Content txt");
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      Alert.alert("Empty Note", "Please extract text from a file first.");
      return;
    }

    setFormStatus("loading");
    try {
      const collectionref = collection(db, `users/${username}/notes`);
      const ctimestamp = new Date().toISOString();
      const data = await addDoc(collectionref, {
        noteTitle: noteTitle.trim() ? noteTitle.trim() : "Untitled Note",
        noteContent: noteContent.trim(),
        timeStamp: ctimestamp,
        source: fileName || "Manual Entry",
      });

      console.log("note added for ", username, " with the id ", data.id);

      // Reset form fields
      setNoteTitle("");
      setNoteContent("");
      setExtractedText("");
      setFileName("");

      setFormStatus("success");
      setTimeout(() => {
        router.replace({
          pathname: "/(dashboard)/MainDashboard",
          params: {
            username,
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Error adding note:", error);
      setFormStatus("issue");
    } finally {
      setTimeout(() => {
        setFormStatus("default");
      }, 2000);
    }
  };

  const renderFormStatusIndicator = () => {
    switch (formStatus) {
      case "loading":
        return (
          <ActivityIndicator
            size="small"
            color="#6200EE"
            style={styles.statusIndicator}
          />
        );
      case "success":
        return <Text style={styles.successText}>Note added successfully!</Text>;
      case "issue":
        return (
          <Text style={styles.errorText}>
            Failed to add note. Please try again.
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formHeader}>Extract Text from Files</Text>

        <TouchableOpacity
          style={styles.filePickerButton}
          onPress={pickDocument}
          disabled={isLoading}
        >
          <Ionicons name="document-text-outline" size={24} color="white" />
          <Text style={styles.filePickerText}>
            {isLoading ? "Processing..." : "Select PDF, Word or TXT File"}
          </Text>
        </TouchableOpacity>

        {fileName ? (
          <Text style={styles.selectedFileName}>Selected: {fileName}</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Note Title"
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholderTextColor="#7B1FA2"
        />

        <Text style={styles.sectionTitle}>Note Content:</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Note Content"
          value={noteContent}
          onChangeText={setNoteContent}
          multiline
          placeholderTextColor="#7B1FA2"
        />

        {extractedText && extractedText !== noteContent && (
          <View>
            <Text style={styles.sectionTitle}>Original Extracted Content:</Text>
            <View style={styles.extractedContentContainer}>
              <ScrollView style={styles.extractedTextScroll}>
                <Text style={styles.extractedText}>{extractedText}</Text>
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => setNoteContent(extractedText)}
            >
              <Text style={styles.restoreButtonText}>
                Restore Original Content
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing file...</Text>
          </View>
        )}

        {renderFormStatusIndicator()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleAddNote}
            disabled={!noteContent || formStatus === "loading"}
          >
            <Text style={styles.getStartedText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundLight,
    flex: 1,
  },
  form: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 15,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.primary,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1C4E9",
    borderRadius: 25,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.primary,
  },
  contentInput: {
    height: 150,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: Colors.primary,
  },
  extractedContentContainer: {
    borderWidth: 1,
    borderColor: "#D1C4E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#F8F5FF",
    minHeight: 150,
    maxHeight: 200,
  },
  extractedTextScroll: {
    maxHeight: 176, // 200 - 24 (padding)
  },
  extractedText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontStyle: "italic",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 60,
  },
  filePickerButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  filePickerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  selectedFileName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    flex: 0.48,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  getStartedText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  successText: {
    color: "#388E3C",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  statusIndicator: {
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 14,
  },
  restoreButton: {
    alignSelf: "center",
    padding: 8,
    borderRadius: 25,
    marginBottom: 12,
    backgroundColor: "#E1BEE7",
  },
  restoreButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
});
