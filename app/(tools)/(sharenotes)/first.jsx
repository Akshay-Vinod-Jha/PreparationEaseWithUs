import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Assuming you're using Expo
import { Colors } from "@/styles/Colors";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
const NotesSharingScreen = () => {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Share your Notes</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log("Access Note");
          router.push({
            pathname: "/(tools)/(sharenotes)/AccessNotesFirst",
            params: {
              username,
            },
          });
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Access Notes</Text>
            <Text style={styles.cardDescription}>
              View and use notes shared by others.
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {/* Replace with your actual image */}
            <Image
              source={require("../../../images/Photo Sharing-rafiki.png")}
              style={styles.cardImage}
            />
          </View>

          <View style={styles.arrowContainer}>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log("Share Notes");
          router.push({
            pathname: "/(tools)/(sharenotes)/ShareNotesFirstPage",
            params: {
              username,
            },
          });
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Share Notes</Text>
            <Text style={styles.cardDescription}>
              Upload and share your notes with others.
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {/* Replace with your actual image */}
            <Image
              source={require("../../../images/Photo Sharing-bro.png")}
              style={styles.cardImage}
            />
          </View>

          <View style={styles.arrowContainer}>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.backgroundLight, // Light purple background
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 24,
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
  imageContainer: {
    width: 100,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary, // Purple color for the arrow circle
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotesSharingScreen;
