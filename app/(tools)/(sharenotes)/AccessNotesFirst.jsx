import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Colors } from "@/styles/Colors";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { router, useLocalSearchParams } from "expo-router";

const fetchSharedNote = async (userId, noteId) => {
  const docRef = doc(db, "users", userId, "notes", noteId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    throw new Error("No Such Note Found");
  }
};

export default function AccessSharedNote() {
  const [sharingCode, setSharingCode] = useState("");
  const [status, setStatus] = useState("default"); // default, loading, success, error
  const [note, setNote] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const { username } = useLocalSearchParams();
  const [addStatus, setAddStatus] = useState("default"); // default, loading, success, error
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple taps

  const handleAccessNote = useCallback(async () => {
    if (isProcessing) return; // Prevent multiple calls

    if (!sharingCode.trim()) {
      setStatus("error");
      setErrorMessage("Please enter a sharing code");
      return;
    }

    try {
      setIsProcessing(true);
      setStatus("loading");

      const parts = sharingCode.split(",__,");
      if (parts.length !== 2) {
        throw new Error("Invalid sharing code format");
      }

      const [userId, noteId] = parts;
      setOwnerId(userId);
      const noteData = await fetchSharedNote(userId, noteId);

      setNote(noteData);
      setStatus("success");
    } catch (error) {
      console.log("Error accessing note:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to access the note");
    } finally {
      setIsProcessing(false);
    }
  }, [sharingCode, isProcessing]);

  const addToMyNotes = useCallback(async () => {
    if (isProcessing) return; // Prevent multiple calls

    try {
      setIsProcessing(true);
      setAddStatus("loading");

      const collectionRef = collection(db, `users/${username}/notes`);
      const ctimestamp = new Date().toISOString();

      await addDoc(collectionRef, {
        noteTitle: note.noteTitle?.trim()
          ? note.noteTitle.trim()
          : "Untitled Note",
        noteContent: note.noteContent?.trim() ? note.noteContent.trim() : "",
        timeStamp: ctimestamp,
      });

      setAddStatus("success");
      Alert.alert("Success", "Note has been added to your collection!", [
        {
          text: "OK",
          onPress: () => {
            setTimeout(() => {
              router.replace({
                pathname: "/(dashboard)/MainDashboard",
                params: {
                  username,
                },
              });
            }, 1000);
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding note:", error);
      setAddStatus("error");
      Alert.alert(
        "Error",
        "Failed to add note to your collection. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [note, username, isProcessing]);

  // Render different buttons based on addStatus
  const renderActionButtons = () => {
    return (
      <>
        {addStatus === "loading" ? (
          <View style={styles.loadingButton}>
            <Text style={styles.loadingButtonText}>
              Adding to your notes...
            </Text>
          </View>
        ) : addStatus === "success" ? (
          <View
            style={[styles.successButton, { backgroundColor: Colors.primary }]}
          >
            <Text style={styles.successButtonText}> Added to your notes</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={addToMyNotes}
            disabled={isProcessing}
          >
            <Text style={styles.backButtonText}>Add To My Notes</Text>
          </TouchableOpacity>
        )}

        {addStatus === "error" && (
          <Text style={styles.errorText}>
            Failed to add note. Please try again.
          </Text>
        )}
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Access Shared Notes</Text>

        {status === "default" || status === "error" ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enter Sharing Code</Text>
              <Text style={styles.cardDescription}>
                Paste the sharing code provided by the note owner
              </Text>

              <TextInput
                style={[styles.input, status === "error" && styles.inputError]}
                value={sharingCode}
                onChangeText={setSharingCode}
                placeholder="Paste sharing code here"
                placeholderTextColor="#999"
              />

              {status === "error" && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.accessButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={handleAccessNote}
              disabled={isProcessing}
            >
              <Text style={styles.accessButtonText}>Access Note</Text>
            </TouchableOpacity>
          </>
        ) : status === "loading" ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Accessing note...</Text>
          </View>
        ) : status === "success" && note ? (
          <>
            <View style={styles.card}>
              <View style={styles.successHeader}>
                <Text style={styles.successText}>
                  Note accessed successfully
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Owner</Text>
                <Text style={styles.fieldValue}>{ownerId}</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Title</Text>
                <Text style={styles.fieldValue}>
                  {note.noteTitle || "Untitled Note"}
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Content</Text>
                <ScrollView style={styles.contentScrollView}>
                  <Text style={styles.fieldDescription}>
                    {note.noteContent}
                  </Text>
                </ScrollView>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Created on</Text>
                <Text style={styles.fieldValue}>
                  {new Date(note.timeStamp).toLocaleString()}
                </Text>
              </View>
            </View>

            {renderActionButtons()}
          </>
        ) : null}

        {/* Add some extra space at the bottom for scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
  accessButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  accessButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  successHeader: {
    backgroundColor: "#e6f7e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#333",
  },
  contentScrollView: {
    maxHeight: 150,
  },
  fieldDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingButton: {
    backgroundColor: "#f0ad4e",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  successButton: {
    backgroundColor: "#5cb85c",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 40, // Extra space at bottom for better scrolling
  },
});
