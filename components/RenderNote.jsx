// First, let's create the RenderNote component that's missing
// Create a file at: @/components/RenderNote.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const RenderNote = ({ note }) => {
  // Add a check to prevent the error
  if (!note || typeof note !== "object") {
    return (
      <View style={styles.noteItem}>
        <Text style={styles.errorText}>Invalid note data</Text>
      </View>
    );
  }

  return (
    <View style={styles.noteItem}>
      <Text style={styles.noteTitle}>{note.noteTitle || "Untitled"}</Text>
      <Text style={styles.noteContent}>{note.noteContent || "No content"}</Text>
      <Text style={styles.noteTimestamp}>{note.timeStamp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  noteItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#4A148C",
  },
  noteContent: {
    fontSize: 16,
    marginBottom: 8,
    color: "#7B1FA2",
  },
  noteTimestamp: {
    fontSize: 12,
    color: "#9575CD",
    textAlign: "right",
  },
  errorText: {
    color: "red",
    fontStyle: "italic",
  },
});

export default RenderNote;
