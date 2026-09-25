import MapView, { Marker } from 'react-native-maps';
import { useEffect, useRef } from 'react';

type Coordinate = { latitude: number; longitude: number };
export function VenueMap({
  coordinate,
  title,
  onSelect,
}: {
  coordinate: Coordinate;
  title: string;
  onSelect?: (value: Coordinate) => void;
}) {
  const ref = useRef<MapView>(null);
  useEffect(() => {
    ref.current?.animateToRegion(
      { ...coordinate, latitudeDelta: 0.035, longitudeDelta: 0.035 },
      500,
    );
  }, [coordinate.latitude, coordinate.longitude]);
  return (
    <MapView
      ref={ref}
      style={{ height: 235, width: '100%' }}
      initialRegion={{ ...coordinate, latitudeDelta: 0.035, longitudeDelta: 0.035 }}
      onPress={onSelect ? (place) => onSelect(place.nativeEvent.coordinate) : undefined}
    >
      <Marker
        coordinate={coordinate}
        title={title}
        pinColor="#185C4B"
        draggable={!!onSelect}
        onDragEnd={(place) => onSelect?.(place.nativeEvent.coordinate)}
      />
    </MapView>
  );
}
