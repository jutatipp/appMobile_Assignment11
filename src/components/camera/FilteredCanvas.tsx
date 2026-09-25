import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Canvas, ColorMatrix, Image, SkImage } from '@shopify/react-native-skia';
import { palette } from './design';

export function FilteredCanvas({ image, matrix }: { image: SkImage | null; matrix: number[] }) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const ready = image && frame.width > 0 && frame.height > 0;
  return (
    <View style={styles.frame} onLayout={(event) => setFrame(event.nativeEvent.layout)}>
      {ready ? (
        <Canvas style={frame}>
          <Image image={image} x={0} y={0} width={frame.width} height={frame.height} fit="contain">
            <ColorMatrix matrix={matrix} />
          </Image>
        </Canvas>
      ) : (
        <ActivityIndicator size="large" color={palette.cyan} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#07100C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
