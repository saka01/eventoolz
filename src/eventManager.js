import { randomUUID } from "crypto";

export class EventManager {
  constructor() {
    this.events = new Map();
  }

  createEvent(
    name,
    description,
    dates,
    creatorId,
    startTime,
    endTime,
    duration,
    expiresAt
  ) {
    const event = {
      id: randomUUID(),
      name,
      description,
      dates,
      creatorId,
      startTime,
      endTime,
      duration,
      expiresAt,
      votes: {},
    };

    this.events.set(event.id, event);
    return event;
  }

  getEvent(id) {
    return this.events.get(id);
  }

  deleteEvent(id) {
    this.events.delete(id);
  }

  addVotes(eventId, userId, dateTimeSlots) {
    const event = this.events.get(eventId);
    if (!event) return false;

    // Check if voting has expired
    if (new Date() > new Date(event.expiresAt)) {
      return {
        success: false,
        message: "Voting has expired for this event."
      };
    }

    // Simply update the vote
    event.votes[userId] = dateTimeSlots;

    return {
      success: true,
      message: "Vote recorded successfully!"
    };
  }

  getEventResults(eventId) {
    const event = this.events.get(eventId);
    if (!event) return null;

    // Create a map to count votes for each date-time slot
    const voteCount = {};

    // Count votes for each date-time slot
    Object.values(event.votes).forEach((userVotes) => {
      userVotes.forEach((dateTime) => {
        voteCount[dateTime] = (voteCount[dateTime] || 0) + 1;
      });
    });

    // Convert to array and sort by votes (descending)
    const sortedResults = Object.entries(voteCount)
      .map(([dateTime, count]) => ({
        dateTime,
        votes: count,
        voters: Object.entries(event.votes)
          .filter(([_, votes]) => votes.includes(dateTime))
          .map(([userId]) => userId),
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      eventName: event.name,
      results: sortedResults,
      totalVoters: Object.keys(event.votes).length,
    };
  }
}
