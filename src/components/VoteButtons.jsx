// Heart-based 1–3 voting system for activities.
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const HEARTS = [1, 2, 3];

/**
 * Props:
 *  - votes: Array of activity_votes objects
 *  - userId: current user's ID
 *  - onVote: (voteValue) => void
 */
const VoteButtons = ({ votes = [], userId, onVote }) => {
  // Find current user's vote
  const myVote = votes.find((v) => v.user_id === userId);
  const myVoteValue = myVote?.vote_value || 0;

  // Total score: sum of all votes
  const totalScore = votes.reduce((sum, v) => sum + (v.vote_value || 0), 0);
  const voteCount = votes.length;

  const handlePress = (value) => {
    if (myVoteValue === value) {
      // Toggle off
      onVote(0);
    } else {
      onVote(value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hearts}>
        {HEARTS.map((val) => {
          const filled = myVoteValue >= val;
          return (
            <TouchableOpacity
              key={val}
              onPress={() => handlePress(val)}
              style={styles.heartBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons
                name={filled ? "heart" : "heart-outline"}
                size={22}
                color={filled ? "#E53935" : "#9E9E9E"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.scoreText}>
        {totalScore} {voteCount > 0 ? `(${voteCount})` : ""}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hearts: {
    flexDirection: "row",
    gap: 2,
  },
  heartBtn: {
    padding: 2,
  },
  scoreText: {
    fontSize: 12,
    color: "#757575",
    minWidth: 36,
  },
});

export default VoteButtons;
