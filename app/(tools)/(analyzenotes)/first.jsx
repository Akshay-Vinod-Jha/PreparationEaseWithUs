import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { db, collection, getDocs } from "@/firebaseConfig";
import NoteCard from "@/components/Notecard";
import { Colors } from "@/styles/Colors";

const LanguageDetectorScreen = () => {
  const { username } = useLocalSearchParams();
  const [status, setStatus] = useState("default"); // "default", "loading", "issue"
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 5; // Number of notes to show initially

  useEffect(() => {
    if (username) {
      getAllNotes(username);
    }
  }, [username]);

  const getAllNotes = async (username) => {
    try {
      setStatus("loading");
      const collectionRef = collection(db, `users/${username}/notes`);
      const snapshot = await getDocs(collectionRef);
      const notesData = snapshot.docs.map((val) => ({
        id: val.id,
        ...val.data(),
      }));

      // Sort notes by timestamp (newest first by default)
      const sortedNotes = sortNotesByDate(notesData, "newest");

      setNotes(sortedNotes);
      setFilteredNotes(sortedNotes); // Set filtered notes initially
      setStatus("default");
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
      setFilteredNotes([]);
      setStatus("issue");
    }
  };

  const sortNotesByDate = (notesArray, order) => {
    return [...notesArray].sort((a, b) => {
      const timeA = a.timeStamp ? new Date(a.timeStamp).getTime() : 0;
      const timeB = b.timeStamp ? new Date(b.timeStamp).getTime() : 0;
      return order === "newest" ? timeB - timeA : timeA - timeB;
    });
  };

  const handleSort = (order) => {
    setSortOrder(order);
    const sorted = sortNotesByDate(filteredNotes, order);
    setFilteredNotes(sorted);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      // Apply current sort when clearing search
      setFilteredNotes(sortNotesByDate(notes, sortOrder));
    } else {
      const filtered = notes.filter((note) =>
        note.noteTitle.toLowerCase().includes(text.toLowerCase())
      );
      // Apply current sort to search results
      setFilteredNotes(sortNotesByDate(filtered, sortOrder));
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const displayedNotes = showAll
    ? filteredNotes
    : filteredNotes.slice(0, initialDisplayCount);

  const renderNoteCard = ({ item }) => (
    <NoteCard
      noteTitle={item.noteTitle ? item.noteTitle : "No Title"}
      noteContent={
        item.noteContent ? item.noteContent : "No Description For Title"
      }
      timestamp={item.timeStamp ? item.timeStamp : "No Timestamp Available"}
      id={item.id}
      onPress={(id) => console.log("Note clicked:", id)}
      loc={"analyzenote"}
      username={username}
      dir={"analyzenotes"}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Analyze Notes</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Note"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortOrder === "newest" && styles.activeSortButton,
          ]}
          onPress={() => handleSort("newest")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortOrder === "newest" && styles.activeSortButtonText,
            ]}
          >
            Newest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortOrder === "oldest" && styles.activeSortButton,
          ]}
          onPress={() => handleSort("oldest")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortOrder === "oldest" && styles.activeSortButtonText,
            ]}
          >
            Oldest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Handling */}
      {status === "loading" && (
        <ActivityIndicator size="large" color="#7B1FA2" />
      )}
      {status === "issue" && (
        <Text style={styles.errorText}>Failed to load notes. Try again.</Text>
      )}

      {/* Notes List */}
      {status === "default" && filteredNotes.length > 0 ? (
        <>
          <FlatList
            data={displayedNotes}
            keyExtractor={(item) => item.id}
            renderItem={renderNoteCard}
            contentContainerStyle={styles.notesList}
            showsVerticalScrollIndicator={false}
          />

          {/* Show More/Less Button */}
          {filteredNotes.length > initialDisplayCount && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={toggleShowAll}
            >
              <Text style={styles.showMoreButtonText}>
                {showAll
                  ? "Show Less"
                  : `Show More (${
                      filteredNotes.length - initialDisplayCount
                    } more)`}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        status === "default" && (
          <Text style={styles.emptyText}>No notes found.</Text>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#555",
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#EDE7F6",
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  activeSortButtonText: {
    color: "white",
  },
  notesList: {
    paddingBottom: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginTop: 20,
  },
  showMoreButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  showMoreButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default LanguageDetectorScreen;
