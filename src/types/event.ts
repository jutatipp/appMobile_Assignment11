export type Event = {
  id: string;
  title: string;
  category: string;
  district: string;
  description: string;
  imageUrl: string;
  startsAt: string;
  latitude: number;
  longitude: number;
  capacity: number;
  organizer: string;
};

export type EventDraft = Omit<Event, 'id' | 'organizer'>;
export type Session = { token: string; name: string; email: string; expiresAt: number };
export type Registration = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  guests: number;
};
