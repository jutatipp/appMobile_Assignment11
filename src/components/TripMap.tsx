import { useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Place } from '../types/place';
export function TripMap({ places, fullScreen = false }: { places: Place[]; fullScreen?: boolean }) {
  const map = useRef<MapView>(null);
  function fit() {
    if (places.length)
      map.current?.fitToCoordinates(places, {
        edgePadding: { top: 45, right: 40, bottom: 45, left: 40 },
        animated: true,
      });
  }
  useEffect(fit, [places.map((place) => place.id).join(',')]);
  if (!places.length) return null;
  return (
    <MapView
      ref={map}
      style={fullScreen ? { flex: 1, width: '100%' } : { height: 250, width: '100%' }}
      onMapReady={fit}
      initialRegion={{
        latitude: places[0].latitude,
        longitude: places[0].longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {places.map((place, index) => (
        <Marker
          key={place.id}
          coordinate={place}
          title={`${index + 1}. ${place.title}`}
          pinColor="#547B24"
        />
      ))}
    </MapView>
  );
}
