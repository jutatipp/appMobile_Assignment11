export type Memory = { id: string; imageUrl: string; createdAt: string };
export type StopTime = { placeId: string; startsAt: string; endsAt: string };
export type Trip = {
  id: string;
  owner: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  placeDays?: { placeId: string; date: string }[];
  placeIds: string[];
  stopTimes?: StopTime[];
  memories: Memory[];
  updatedAt: string;
};
export type TripDraft = Pick<
  Trip,
  'title' | 'startsAt' | 'placeIds' | 'stopTimes' | 'endsAt' | 'placeDays'
>;
