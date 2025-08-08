import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/styles/Colors";
const NoteCard = ({
  noteTitle,
  noteContent,
  timestamp,
  id,
  loc,
  dir,
  username,
  data = "",
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => {
        console.log("Note with id was pressed", id);
        router.push({
          pathname: `/(tools)/(${dir})/${loc}`,
          params: {
            id,
            noteTitle,
            noteContent,
            timestamp,
            username,
            data,
          },
        });
      }}
    >
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {noteTitle}
        </Text>
        <Text style={styles.noteText} numberOfLines={2}>
          {noteContent}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary, // Accent color on the left
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#4A148C",
  },
  noteText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    textAlign: "right",
  },
});

export default NoteCard;
