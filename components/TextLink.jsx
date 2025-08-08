import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../styles/Colors";

const TextLink = ({ text, onPress, style, inline = false }) => {
  if (inline) {
    return (
      <Text style={[styles.linkTextInline, style]} onPress={onPress}>
        {" "}
        {text}
      </Text>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Text style={styles.linkText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  linkText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  linkTextInline: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default TextLink;
