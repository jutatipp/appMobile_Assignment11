import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ui } from '../theme';
export function FormScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['bottom']} style={ui.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={95}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
