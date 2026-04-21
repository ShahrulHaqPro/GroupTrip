import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, Avatar, useTheme } from 'react-native-paper';

/**
 * Props:
 *  - expense: expense object
 *  - members: array of member profiles
 *  - userId: current user id
 *  - onDelete: () => void
 */
const ExpenseCard = ({ expense, members = [], userId, onDelete }) => {
  const theme = useTheme();
  const { description, amount, paid_by, split_among = [], profiles } = expense;

  const paidByName = profiles?.name || 'Someone';
  const splitCount = split_among.length || 1;
  const perPerson = (Number(amount) / splitCount).toFixed(2);
  const iYouPaid = paid_by === userId;
  const amISplit = split_among.includes(userId);

  // What does this mean for me?
  let myLabel = '';
  if (iYouPaid && amISplit) {
    const iOwe = (Number(amount) - Number(perPerson)).toFixed(2);
    myLabel = `You paid · others owe you $${iOwe}`;
  } else if (iYouPaid) {
    myLabel = `You paid · others owe you $${Number(amount).toFixed(2)}`;
  } else if (amISplit) {
    myLabel = `You owe $${perPerson}`;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <Avatar.Text
            size={40}
            label={paidByName.slice(0, 2).toUpperCase()}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.info}>
            <Text variant="titleSmall" numberOfLines={1}>{description}</Text>
            <Text style={[styles.payer, { color: theme.colors.onSurfaceVariant }]}>Paid by {paidByName}</Text>
            {myLabel ? <Text style={[styles.myLabel, iYouPaid && styles.positive]}>{myLabel}</Text> : null}
          </View>
          <View style={styles.right}>
            <Text variant="titleMedium" style={[styles.amount, { color: theme.colors.onSurface }]}>${Number(amount).toFixed(2)}</Text>
            <Text style={[styles.perPerson, { color: theme.colors.onSurfaceVariant }]}>${perPerson}/person</Text>
            {onDelete && (
              <IconButton
                icon="delete-outline"
                size={16}
                onPress={onDelete}
                style={styles.deleteBtn}
              />
            )}
          </View>
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    backgroundColor: '#6750A4',
  },
  info: {
    flex: 1,
  },
  payer: {
    fontSize: 12,
    marginTop: 2,
  },
  myLabel: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 2,
    fontWeight: '500',
  },
  positive: {
    color: '#388E3C',
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
  },
  perPerson: {
    fontSize: 11,
  },
  deleteBtn: {
    margin: 0,
    marginTop: -4,
  },
});

export default ExpenseCard;
