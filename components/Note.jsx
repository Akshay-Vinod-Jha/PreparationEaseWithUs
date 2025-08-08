// components/Note.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Note = ({ header, description }) => {
  return (
    <View style={styles.noteCard}>
      <Text style={styles.noteTitle}>{header}</Text>
      <Text style={styles.noteDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: '#D1C4E9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4A148C',
    marginBottom: 8,
  },
  noteDescription: {
    fontSize: 14,
    color: '#4A148C',
    lineHeight: 20,
  },
});

export default Note;
