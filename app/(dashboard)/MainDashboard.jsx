import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "@/styles/Colors";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
// Features data remains the same
export const features = [
  {
    id: 8,
    name: "Images to Notes",
    image: require("../../images/imagetonote.png"),
    navigateTo: "/(tools)/(imagetonotes)/first",
    indirectNavigateTo: "/(tools)/(imagetonotes)/first",
  },
  {
    id: 1,
    name: "Detect Language",
    image: require("../../images/translate.png"),
    navigateTo: "/(tools)/(detectlanguage)/first",
    indirectNavigateTo: "/(tools)/(detectlanguage)/displayIndNote",
  },
  {
    id: 2,
    name: "Translate Notes",
    image: require("../../images/Translator-amico.png"),
    navigateTo: "/(tools)/(translatenotes)/first",
    indirectNavigateTo: "/(tools)/(translatenotes)/translatenote",
  },
  {
    id: 3,
    name: "Analyze Notes",
    image: require("../../images/Research paper-amico.png"),
    navigateTo: "/(tools)/(analyzenotes)/first",
    indirectNavigateTo: "/(tools)/(analyzenotes)/analyzenote",
  },
  {
    id: 4,
    name: "Extract Keywords",
    image: require("../../images/Tabs-rafiki.png"),
    navigateTo: "/(tools)/(extractkeywords)/first",
    indirectNavigateTo: "/(tools)/(extractkeywords)/extractkeywords",
  },
  {
    id: 5,
    name: "Visualize Notes",
    image: require("../../images/Notes-amico.png"),
    navigateTo: "/(tools)/(visualizenotes)/first",
    indirectNavigateTo: "/(tools)/(visualizenotes)/visualizenotes",
  },
  {
    id: 6,
    name: "Check Grammar",
    image: require("../../images/Choose-rafiki.png"),
    navigateTo: "/(tools)/(checkgrammar)/first",
    indirectNavigateTo: "/(tools)/(checkgrammar)/checkgrammar",
  },
  {
    id: 7,
    name: "Listen to Notes",
    image: require("../../images/Audiobook-pana.png"),
    navigateTo: "/(tools)/(textoaudio)/first",
    indirectNavigateTo: "/(tools)/(textoaudio)/MainFile",
  },

  {
    id: 9,
    name: "Handwritten Notes Converter",
    image: require("../../images/Notes-bro.png"),
    navigateTo: "/(tools)/(texttohand)/first",
    indirectNavigateTo: "/(tools)/(texttohand)/displayallttf",
  },
  {
    id: 10,
    name: "Share Your Notes",
    image: require("../../images/Photo Sharing-bro.png"),
    navigateTo: "/(tools)/(sharenotes)/first",
    indirectNavigateTo: "/(tools)/(sharenotes)/ShareNotesSecond",
  },
];

const MainDashboard = () => {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [status, setStatus] = useState("default"); // 'default', 'loading', 'issue'

  useEffect(() => {
    console.log("MainDashboard username is", username);
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

  const handleProfile = () => {
    router.push({
      pathname: "/(profile)/profile",
      params: {
        username,
      },
    });
  };

  const handleViewNote = (item) => {
    router.push({
      pathname: "/(individualnote)/viewnote",
      params: {
        username,
        noteTitle: item.noteTitle,
        timeStamp: item.timeStamp,
        noteContent: item.noteContent,
        noteId: item.id,
      },
    });
  };

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => handleViewNote(item)}
    >
      <View style={styles.noteCardContent}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.noteTitle}
        </Text>
        <Text style={styles.noteDate}>
          {item.timeStamp
            ? new Date(item.timeStamp).toLocaleDateString()
            : "No date"}
        </Text>
        {item.noteContent && (
          <Text style={styles.notePreview} numberOfLines={2}>
            {item.noteContent}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={Colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.backgroundLight}
        barStyle="dark-content"
      />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.prepEaseText}>PREPEASE</Text>
        <TouchableOpacity onPress={handleProfile} style={styles.profileIcon}>
          <Icon name="person" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.nameText}>{username || "User"}!</Text>
          <Text style={styles.descriptionText}>
            Your Smart Study Companion! Analyze, Summarize & Optimize Notes
            Effortlessly
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(addnotes)/addnote",
                params: { username },
              })
            }
            style={[styles.getStartedButton, styles.marginBottom]}
          >
            <Text style={styles.getStartedText}>Add Your Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() =>
              router.push({
                pathname: "/(dashboard)/GetStartedPrepase",
                params: {
                  username,
                },
              })
            }
          >
            <Text style={styles.getStartedText}>Get Started with PrepEase</Text>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <TouchableOpacity
              onPress={() => getAllNotes(username)}
              style={styles.refreshButton}
            >
              <Icon name="refresh" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search and Sort Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={18}
                color="#888"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes by title..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearch("")}
                  style={styles.clearButton}
                >
                  <Icon name="close" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <View style={styles.sortButtonsContainer}>
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
            </View>
          </View>

          {/* Notes List */}
          {status === "loading" ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your notes...</Text>
            </View>
          ) : status === "issue" ? (
            <View style={styles.messageContainer}>
              <Icon name="error-outline" size={36} color={Colors.primary} />
              <Text style={styles.messageText}>
                Unable to load your notes. Please check your connection and try
                again.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => getAllNotes(username)}
              >
                <Text style={styles.actionButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotes.length === 0 ? (
            <View style={styles.messageContainer}>
              <Icon name="note-add" size={36} color={Colors.primary} />
              <Text style={styles.messageText}>
                {searchQuery.trim() !== ""
                  ? "No notes match your search criteria."
                  : "You don't have any notes yet."}
              </Text>
              {searchQuery.trim() !== "" ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSearch("")}
                >
                  <Text style={styles.actionButtonText}>Clear Search</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(addnotes)/addnote",
                      params: { username },
                    })
                  }
                >
                  <Text style={styles.actionButtonText}>
                    Create Your First Note
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.notesListContainer}>
              <Text style={styles.resultsText}>
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1 ? "note" : "notes"} found
                {searchQuery ? ` for "${searchQuery}"` : ""}
              </Text>
              <FlatList
                data={filteredNotes}
                renderItem={renderNoteItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Disable scrolling since we're in a ScrollView
                contentContainerStyle={styles.notesList}
                ListFooterComponent={<View style={styles.listFooter} />}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  prepEaseText: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 25,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 20,
    lineHeight: 20,
  },
  marginBottom: {
    marginBottom: 10,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  getStartedText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  notesSection: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  refreshButton: {
    padding: 5,
  },
  controlsContainer: {
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  sortLabel: {
    fontSize: 14,
    color: "#555",
  },
  sortButtonsContainer: {
    flexDirection: "row",
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeSortButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeSortButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  notesListContainer: {
    marginTop: 5,
  },
  resultsText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  notesList: {
    paddingVertical: 5,
  },
  noteCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    borderWidth: 1,
    borderColor: "#eee",
  },
  noteCardContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 11,
    color: "#888",
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  messageContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 10,
  },
  messageText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    elevation: 1,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  listFooter: {
    height: 20,
  },
});

export default MainDashboard;
