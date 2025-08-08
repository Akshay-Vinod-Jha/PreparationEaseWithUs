import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/styles/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as SpeechRecognition from "expo-speech-recognition";

export default function SpeechToTextModal({ visible, onClose, onSave }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check for permission when the modal opens
    if (visible) {
      checkPermission();
    }
    // Clean up when modal closes
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [visible]);

  const checkPermission = async () => {
    try {
      // Use the available methods from the Speech Recognition API
      const available = await SpeechRecognition.isAvailableAsync();

      if (!available) {
        setErrorMsg("Speech recognition is not available on this device");
        setHasPermission(false);
        return;
      }

      // Get the current permissions status instead of requesting
      const { status } = await SpeechRecognition.getPermissionsAsync();

      if (status !== "granted") {
        // Request permissions if not granted
        const { status: newStatus } =
          await SpeechRecognition.requestPermissionsAsync();
        setHasPermission(newStatus === "granted");

        if (newStatus !== "granted") {
          setErrorMsg("Microphone permission not granted");
        }
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error checking speech recognition:", error);
      setErrorMsg("Error initializing speech recognition");
      setHasPermission(false);
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setErrorMsg("");

      // Start listening with the correct options
      await SpeechRecognition.startListeningAsync({
        partialResults: true,
        onResults: handleSpeechResults,
      });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setErrorMsg("Failed to start listening. Please try again.");
      setIsListening(false);
    }
  };

  const handleSpeechResults = (results) => {
    if (results && results.value && results.value.length > 0) {
      setRecognizedText(results.value[0]);
    }
  };

  const stopListening = async () => {
    try {
      await SpeechRecognition.stopListeningAsync();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    } finally {
      setIsListening(false);
    }
  };

  const handleSave = () => {
    onSave({ content: recognizedText });
    setRecognizedText("");
    onClose();
  };

  const handleCancel = () => {
    setRecognizedText("");
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Speech to Text</Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {!hasPermission ? (
            <Text style={styles.permissionText}>
              Microphone permission is required for speech recognition.
            </Text>
          ) : (
            <>
              <View style={styles.recognizedTextContainer}>
                <Text style={styles.recognizedTextLabel}>Recognized Text:</Text>
                <Text style={styles.recognizedText}>
                  {recognizedText || "Say something..."}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isListening ? styles.recordingButton : {},
                ]}
                onPress={isListening ? stopListening : startListening}
              >
                <Ionicons
                  name={isListening ? "stop-circle" : "mic"}
                  size={40}
                  color="white"
                />
                {isListening && (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    style={styles.recordingIndicator}
                  />
                )}
              </TouchableOpacity>

              <Text style={styles.instructionText}>
                {isListening
                  ? "Listening... Tap to stop"
                  : "Tap the microphone to start recording"}
              </Text>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                !recognizedText ? styles.disabledButton : {},
              ]}
              onPress={handleSave}
              disabled={!recognizedText}
            >
              <Text style={styles.saveButtonText}>Use Text</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalView: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 15,
  },
  recognizedTextContainer: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    minHeight: 100,
    maxHeight: 200,
  },
  recognizedTextLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  recognizedText: {
    fontSize: 16,
    color: "#333",
  },
  recordButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  recordingButton: {
    backgroundColor: "red",
  },
  recordingIndicator: {
    position: "absolute",
    right: 5,
    top: 5,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 25,
    padding: 12,
    elevation: 2,
    flex: 0.48,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelButtonText: {
    color: Colors.primary,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  permissionText: {
    color: "orange",
    marginBottom: 15,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
