import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { db, collection } from "@/firebaseConfig";
import { addDoc } from "firebase/firestore";
import { Colors } from "@/styles/Colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import SpeechToTextModal from "@/components/SpeechToTextModal"; // Make sure this path is correct

export default function AddNote() {
  const { username } = useLocalSearchParams();
  useEffect(() => {
    console.log("username from ", username, " addnote");
  }, [username]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [formStatus, setFormStatus] = useState("default"); //default,success,issue,loading
  const [speechModalVisible, setSpeechModalVisible] = useState(false);
  const router = useRouter();

  const goToImageToNote = () => {
    router.push({
      pathname: "/(tools)/(imagetonotes)/first",
      params: {
        username,
      },
    });
  };

  const micbuttonclick = () => {
    console.log("wants to ask the mic function");
    setSpeechModalVisible(true);
  };

  const handleSpeechResult = (result) => {
    // Update note content with speech recognition result
    if (result && result.content) {
      setNoteContent(result.content);
    }
  };

  const extractFromTextualFiles = () => {
    console.log("wants to extract from files");
    router.push({
      pathname: "/(tools)/(fileextractor)/ExtractFromTextualFiles",
      params: {
        username,
      },
    });
  };

  const accesShareNote = () => {
    router.push({
      pathname: "/(tools)/(sharenotes)/AccessNotesFirst",
      params: {
        username,
      },
    });
  };

  const handleAddNote = async () => {
    setFormStatus("loading");
    try {
      const collectionref = collection(db, `users/${username}/notes`);
      const ctimestamp = new Date().toISOString();
      const data = await addDoc(collectionref, {
        noteTitle: noteTitle.trim() ? noteTitle.trim() : "",
        noteContent: noteContent.trim() ? noteContent.trim() : "",
        timeStamp: ctimestamp,
      });
      console.log("note added for ", username, " with the id ", data.id);

      // Reset form fields
      setNoteTitle("");
      setNoteContent("");
      setFormStatus("success");
      setTimeout(
        () =>
          router.replace({
            pathname: "/(dashboard)/MainDashboard",
            params: {
              username,
            },
          }),
        1000
      );
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
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formHeader}>Create New Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Note Title"
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholderTextColor="#7B1FA2"
        />
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Note Content"
          value={noteContent}
          onChangeText={setNoteContent}
          multiline
          placeholderTextColor="#7B1FA2"
        />
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
            disabled={formStatus === "loading"}
          >
            <Text style={styles.getStartedText}>Save Note</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { width: "100%", flex: 1 },
            ]}
            onPress={goToImageToNote}
          >
            <Text style={styles.getStartedText}>Image To Note</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { width: "100%", flex: 1 },
            ]}
            onPress={accesShareNote}
          >
            <Text style={styles.getStartedText}>Access Shared Notes</Text>
          </TouchableOpacity>
        </View>
        {/* <View
          style={[
            styles.buttonContainer,
            {
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { width: "100%", flex: 1 },
            ]}
            onPress={extractFromTextualFiles}
          >
            <Text style={styles.getStartedText}>
              Extract From Textual Files
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "red",
              marginLeft: 10,
              aspectRatio: 1,
              borderRadius: 50,
              padding: 10,
            }}
            onPress={micbuttonclick}
          >
            <Ionicons name="mic" size={20} color={"white"} />
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Speech-to-Text Modal */}
      <SpeechToTextModal
        visible={speechModalVisible}
        onClose={() => setSpeechModalVisible(false)}
        onSave={handleSpeechResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 0,
    marginBottom: 20,
    marginTop: 10,
  },
  getStartedText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  form: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1C4E9",
    borderRadius: 25,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.primary,
  },
  contentInput: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
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
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
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
});
