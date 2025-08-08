import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "@/styles/Colors";

const FeatureListItem = ({ feature, onPress, username }) => {
  // Get feature description based on feature name
  const getFeatureDescription = (name) => {
    switch (name) {
      case "Detect Language":
        return "Identify the language used in uploaded notes.";
      case "Translate Notes":
        return "Convert your notes into different languages easily.";
      case "Analyze Notes":
        return "Process and extract key insights from your notes.";
      case "Extract Keywords":
        return "Identify key topics and important terms from your notes.";
      case "Visualize Notes":
        return "Create visual representations of your note content.";
      case "Check Grammar":
        return "Verify spelling and grammar in your documents.";
      case "Listen to Notes":
        return "Convert your text notes to audio format.";
      case "Images to Notes":
        return "Extract text content from images.";
      case "Handwritten Notes Converter":
        return "Convert handwritten content to digital text.";
      case "Share Your Notes":
        return "Share your notes with classmates or colleagues.";
      default:
        return "Explore this feature to enhance your study experience.";
    }
  };

  return (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={() => onPress(feature.navigateTo, username)}
    >
      {/* Top half with image */}
      <View style={styles.imageContainer}>
        <Image source={feature.image} style={styles.featureImage} />
      </View>

      {/* Bottom half with text content */}
      <View style={styles.textContainer}>
        <Text style={styles.featureName}>{feature.name}</Text>
        <Text style={styles.featureDescription}>
          {getFeatureDescription(feature.name)}
        </Text>

        {/* Arrow indicator */}
        <View style={styles.arrowContainer}>
          <Icon
            name="chevron-right"
            size={20}
            color={Colors.primaryDark || "#4A148C"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FeatureList = ({ features, navigation, username }) => {
  const handleFeaturePress = (navigateTo, username) => {
    navigation.push({
      pathname: navigateTo,
      params: { username },
    });
  };

  return (
    <View style={styles.container}>
      {features.map((feature) => (
        <FeatureListItem
          key={feature.id}
          feature={feature}
          onPress={handleFeaturePress}
          username={username}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: "#F8F0FC",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  featureImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  textContainer: {
    padding: 16,
  },
  featureName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A148C",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6A1B9A",
    marginBottom: 4,
  },
  arrowContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
});

export default FeatureList;
