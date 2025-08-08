import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/styles/Colors";

export default function ShareNotesSecond() {
  const { id, noteTitle, noteContent, timestamp, username } =
    useLocalSearchParams();
  const [sharingCode, setSharingCode] = useState("");
  const [expanded, setExpanded] = useState(false);
  const maxPreviewLines = 3;

  const handleGenerateId = () => {
    console.log("Generate ID pressed");
    console.log(`${username},__,${id}`);
    setSharingCode(`${username},__,${id}`);
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Paste this code to access the note shared by *${username}*, code: *${sharingCode}*`;

      const result = await Share.share({
        message: shareMessage,
        title: `${noteTitle} - Shared Note`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared with ${result.activityType}`);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong sharing the note");
      console.error(error);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.header}>Share Notes</Text>
      <Text style={styles.subHeader}>Preview</Text>

      <View style={styles.previewCard}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Owner Username</Text>
          <Text style={styles.fieldValue}>{username}</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Title</Text>
          <Text style={styles.fieldValue}>{noteTitle}</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <ScrollView
            style={expanded ? styles.expandedContent : styles.collapsedContent}
            contentContainerStyle={styles.descriptionContainer}
            nestedScrollEnabled={true}
          >
            <Text style={styles.fieldDescription}>{noteContent}</Text>
          </ScrollView>
          <TouchableOpacity
            onPress={toggleExpanded}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {expanded ? "Show Less" : "Show More"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!sharingCode ? (
        <TouchableOpacity style={styles.shareButton} onPress={handleGenerateId}>
          <Text style={styles.shareButtonText}>Generate ID</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={[styles.previewCard, { marginTop: 20 }]}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Use this Code to access</Text>
              <Text
                style={[
                  styles.fieldDescription,
                  { color: Colors.primary, fontWeight: "bold" },
                ]}
              >
                {sharingCode}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  subHeader: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#333",
  },
  collapsedContent: {
    maxHeight: 80,
  },
  expandedContent: {
    maxHeight: 200,
  },
  descriptionContainer: {
    paddingRight: 8,
  },
  fieldDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  expandButton: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  expandButtonText: {
    color: Colors.primary || "#7b519d",
    fontWeight: "bold",
  },
  shareButton: {
    backgroundColor: Colors.primary || "#7b519d",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
