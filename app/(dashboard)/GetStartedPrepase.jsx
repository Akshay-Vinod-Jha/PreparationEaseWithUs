import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import FeatureList from "@/components/FeatureList";
import { features } from "./MainDashboard";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { Colors } from "@/styles/Colors";
const GetStartedPage = () => {
  const router = useRouter();
  const { username } = useLocalSearchParams();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello</Text>
        <Text style={styles.usernameText}>{username}!</Text>
        <Text style={styles.instructionText}>
          To get started, select one of the features below from our application
        </Text>
      </View>
      <View style={styles.exploreSection}>
        <Text style={styles.exploreText}>Explore Our Powerful Features</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FeatureList
          features={features}
          navigation={router}
          username={username}
        />
      </ScrollView>
      {/* <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.featuresContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsGrid}>
          {features.map((feature) => (
            <Card
              key={feature.id}
              imageSource={feature.image}
              featureName={feature.name}
              onPress={() => handleCardPress(feature.navigateTo)}
            />
          ))}
        </View>
      </ScrollView> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight, // Light purple background
  },
  exploreSection: {
    padding: 20,
    paddingTop: -20,
    paddingBottom: 10,
  },
  exploreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  // header: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   paddingHorizontal: 20,
  //   paddingVertical: 15,
  //   backgroundColor: Colors.primary, // Darker purple for header
  // },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 22,
    color: Colors.primary,
  },
  usernameText: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.primary,
    opacity: 0.8,
  },
  // scrollView: {
  //   flex: 1,
  // },
  // featuresContainer: {
  //   paddingHorizontal: 16,
  //   paddingBottom: 80, // Additional padding at bottom for home button
  // },
  // cardsGrid: {
  //   flexDirection: "row",
  //   flexWrap: "wrap",
  //   justifyContent: "space-between",
  //   paddingTop: 8,
  // },
  // homeButtonContainer: {
  //   position: "absolute",
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: "#9575CD",
  //   height: 60,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // homeButton: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: "#FFFFFF",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // homeIcon: {
  //   width: 24,
  //   height: 24,
  //   resizeMode: "contain",
  // },
});

export default GetStartedPage;
