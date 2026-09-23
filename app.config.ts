import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nong Khai Explore',
  slug: 'appLocation_Maps',
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        // ใช้ Apple Maps บน iOS; Android native build ต้องมี key ที่จำกัด package/SHA-1
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    ],
  ],
});
