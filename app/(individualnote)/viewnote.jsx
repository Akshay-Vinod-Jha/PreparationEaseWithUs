import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/styles/Colors";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { features } from "../(dashboard)/MainDashboard";

export default function ViewNote() {
  const { username, noteTitle, timeStamp, noteContent, noteId } =
    useLocalSearchParams();
  const router = useRouter();

  // State variables
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);
  const [updatedNoteTitle, setUpdatedNoteTitle] = useState(noteTitle);
  const [updatedNoteContent, setUpdatedNoteContent] = useState(noteContent);
  const [deleteStatus, setDeleteStatus] = useState("default");
  const [updateStatus, setUpdateStatus] = useState("default");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    console.log(username, noteTitle, noteContent, timeStamp, noteId);
    console.log("from view individual note");

    // Add keyboard listeners
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

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Date unavailable";
    }
  };

  const handleDeleteNote = async () => {
    setDeleteStatus("loading");
    try {
      const noteRef = doc(db, `users/${username}/notes/${noteId}`);
      await deleteDoc(noteRef);

      setDeleteStatus("success");
      setTimeout(() => {
        setDeleteModalVisible(false);
        setDeleteStatus("default");
        router.replace({
          pathname: "/(dashboard)/MainDashboard",
          params: {
            username,
          },
        }); // Navigate back after successful deletion
      }, 1000);
    } catch (error) {
      console.error("Error deleting note:", error);
      setDeleteStatus("issue");
      setTimeout(() => {
        setDeleteStatus("default");
      }, 2000);
    }
  };

  const handleUpdateNote = async () => {
    setUpdateStatus("loading");
    try {
      const noteRef = doc(db, `users/${username}/notes/${noteId}`);
      await updateDoc(noteRef, {
        noteTitle: updatedNoteTitle.trim(),
        noteContent: updatedNoteContent.trim(),
      });

      setUpdateStatus("success");
      setTimeout(() => {
        setUpdateModalVisible(false);
        setUpdateStatus("default");
        router.replace({
          pathname: "/(individualnote)/viewnote",
          params: {
            username,
            noteTitle: updatedNoteTitle.trim(),
            noteContent: updatedNoteContent.trim(),
            timeStamp,
            noteId,
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Error updating note:", error);
      setUpdateStatus("issue");
      setTimeout(() => {
        setUpdateStatus("default");
      }, 2000);
    }
  };

  const renderFeatureItem = ({ item }) =>
    item.name === "Images to Notes" ? null : (
      <TouchableOpacity
        style={styles.featureItem}
        onPress={() => {
          console.log(
            `Feature selected: ${item.name} ${item.indirectNavigateTo}`
          );
          setFeaturesModalVisible(false);
          router.push({
            pathname: item.indirectNavigateTo,
            params: {
              noteTitle,
              noteContent,
              id: noteId,
              timestamp: timeStamp,
              username,
              data: noteContent,
            },
          });
        }}
      >
        <Image source={item.image} style={styles.featureImage} />
        <Text style={styles.featureName}>{item.name}</Text>
      </TouchableOpacity>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button and features menu */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: "/(dashboard)/MainDashboard",
              params: {
                username,
              },
            })
          }
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Note Details</Text>

        <TouchableOpacity
          style={styles.featuresButton}
          onPress={() => setFeaturesModalVisible(true)}
        >
          <Ionicons name="apps" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Note content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{noteTitle}</Text>
          <Text style={styles.timestamp}>{formatDate(timeStamp)}</Text>
        </View>

        <View style={styles.notePaper}>
          <Text style={styles.noteContent}>{noteContent}</Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.updateButton]}
          onPress={() => setUpdateModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{noteTitle}"? This action cannot
              be undone.
            </Text>

            <View style={styles.modalActions}>
              {deleteStatus === "default" && (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setDeleteModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmDeleteButton]}
                    onPress={handleDeleteNote}
                  >
                    <Text style={styles.confirmButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}

              {deleteStatus === "loading" && (
                <View style={styles.statusContainer}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.statusText}>Deleting...</Text>
                </View>
              )}

              {deleteStatus === "success" && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="green" />
                  <Text style={[styles.statusText, { color: "green" }]}>
                    Note deleted successfully!
                  </Text>
                </View>
              )}

              {deleteStatus === "issue" && (
                <View style={styles.statusContainer}>
                  <Ionicons name="alert-circle" size={24} color="red" />
                  <Text style={[styles.statusText, { color: "red" }]}>
                    Failed to delete note. Please try again.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Note Modal */}
      <Modal
        visible={updateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                styles.updateModalContainer,
                keyboardVisible && styles.keyboardOpenContainer,
              ]}
            >
              <View style={styles.updateModalHeader}>
                <Text style={styles.modalTitle}>Update Note</Text>
                <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.updateScrollContainer}
                contentContainerStyle={styles.updateScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.titleInput}
                    value={updatedNoteTitle}
                    onChangeText={setUpdatedNoteTitle}
                    placeholder="Note Title"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Content</Text>
                  <TextInput
                    style={styles.contentInput}
                    value={updatedNoteContent}
                    onChangeText={setUpdatedNoteContent}
                    placeholder="Note Content"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                {updateStatus === "default" && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.updateConfirmButton]}
                    onPress={handleUpdateNote}
                    disabled={
                      !updatedNoteTitle.trim() || !updatedNoteContent.trim()
                    }
                  >
                    <Text style={styles.confirmButtonText}>Update Note</Text>
                  </TouchableOpacity>
                )}

                {updateStatus === "loading" && (
                  <View style={styles.statusContainer}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text style={styles.statusText}>Updating...</Text>
                  </View>
                )}

                {updateStatus === "success" && (
                  <View style={styles.statusContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="green" />
                    <Text style={[styles.statusText, { color: "green" }]}>
                      Note updated successfully!
                    </Text>
                  </View>
                )}

                {updateStatus === "issue" && (
                  <View style={styles.statusContainer}>
                    <Ionicons name="alert-circle" size={24} color="red" />
                    <Text style={[styles.statusText, { color: "red" }]}>
                      Failed to update note. Please try again.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Features Modal */}
      <Modal
        visible={featuresModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFeaturesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.featuresModalContainer]}>
            <View style={styles.updateModalHeader}>
              <Text style={styles.modalTitle}>Available Features</Text>
              <TouchableOpacity onPress={() => setFeaturesModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={features.filter((item) => item.name !== "Images to Notes")}
              renderItem={renderFeatureItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.featuresList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  featuresButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  noteHeader: {
    marginBottom: 16,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textDark,
  },
  notePaper: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    padding: 16,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textDark,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 8,
  },
  updateButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  updateModalContainer: {
    height: "70%",
    maxHeight: 600,
    display: "flex",
    flexDirection: "column",
  },
  keyboardOpenContainer: {
    height: "60%", // Smaller when keyboard is open
  },
  updateScrollContainer: {
    flex: 1,
  },
  updateScrollContent: {
    flexGrow: 1,
  },
  featuresModalContainer: {
    height: "80%",
  },
  updateModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  confirmDeleteButton: {
    backgroundColor: "#f44336",
  },
  updateConfirmButton: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
  },
  cancelButtonText: {
    color: Colors.textDark,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  featuresList: {
    paddingVertical: 8,
  },
  featureItem: {
    width: "48%",
    margin: "1%",
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 8,
  },
  featureName: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textDark,
    textAlign: "center",
  },
});
