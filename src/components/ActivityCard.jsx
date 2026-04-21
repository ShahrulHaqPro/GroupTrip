import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import VoteButtons from './VoteButtons';

/**
 * Props:
 *  - activity: activity object (with activity_votes array)
 *  - userId: current user id
 *  - onVote: (activityId, voteValue) => void
 *  - onPress: () => void
 *  - onDelete: () => void (optional, only if owner)
 */
const ActivityCard = ({ activity, userId, onVote, onPress, onDelete }) => {
  const theme = useTheme();
  const {
    name,
    datetime,
    address,
    notes,
    cost,
    activity_votes = [],
    profiles,
    isDraft,
  } = activity;

  const formattedTime = datetime
    ? format(parseISO(datetime), 'EEE, MMM d · h:mm a')
    : 'No time set';

  return (
    <Card style={[styles.card, isDraft && styles.draftCard]} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {isDraft && (
              <Chip compact style={styles.draftChip} textStyle={styles.draftChipText}>
                DRAFT
              </Chip>
            )}
            <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
              {name}
            </Text>
          </View>
          {onDelete && (
            <IconButton
              icon="delete-outline"
              size={18}
              onPress={onDelete}
              style={styles.deleteBtn}
            />
          )}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>{formattedTime}</Text>
        </View>

        {address ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>{address}</Text>
          </View>
        ) : null}

        {cost != null && cost > 0 ? (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>${Number(cost).toFixed(2)}</Text>
          </View>
        ) : null}

        {notes ? (
          <Text style={[styles.notes, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>{notes}</Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={[styles.addedBy, { color: theme.colors.onSurfaceVariant }]}>
            {profiles?.name ? `Added by ${profiles.name}` : ''}
          </Text>
          <VoteButtons
            votes={activity_votes}
            userId={userId}
            onVote={(val) => onVote(activity.id, val)}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  draftCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontWeight: '600',
    flex: 1,
  },
  draftChip: {
    backgroundColor: '#FFF3E0',
    height: 20,
  },
  draftChipText: {
    fontSize: 10,
    color: '#E65100',
  },
  deleteBtn: {
    margin: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    flex: 1,
  },
  notes: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  addedBy: {
    fontSize: 11,
  },
});

export default ActivityCard;
