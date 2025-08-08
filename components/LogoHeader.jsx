import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { Colors } from "../styles/Colors";
const PrepaseLogo = require("../images/PrepaseLogo.jpg");
const LogoHeader = () => {
  return (
    <View style={styles.container}>
      <Image source={PrepaseLogo} style={styles.logo} />
      <Text style={styles.tagline}>MAKING LEARNING EASY</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textDark,
    marginTop: 8,
  },
});

export default LogoHeader;
