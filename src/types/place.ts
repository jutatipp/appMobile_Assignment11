export type Place = {
  id: string;
  title: string;
  category: string;
  district: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  contributor: string;
};

export type PlaceDraft = Omit<Place, 'id' | 'contributor'>;
export type Session = { token: string; name: string; email: string; expiresAt: number };
