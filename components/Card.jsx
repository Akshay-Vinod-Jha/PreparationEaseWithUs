import React from "react";
import { Text, Image, StyleSheet, TouchableOpacity } from "react-native";
const Card = ({ imageSource, featureName, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={imageSource} style={styles.image} />
      <Text style={styles.featureName}>{featureName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "45%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 16,
    marginHorizontal: "2.5%",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBlock: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  image: {
    width: "80%",
    height: "70%",
    resizeMode: "contain",
    marginBottom: 16,
  },
  featureName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 5,
  },
});

export default Card;
