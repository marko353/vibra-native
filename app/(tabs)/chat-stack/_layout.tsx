// app/(tabs)/chat-stack/_layout.tsx

import { Stack } from 'expo-router';

export default function ChatStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      
      {/* ✅ KLJUČNA IZMENA: Morate uključiti headerShown: true da bi se renderovao 
           prilagođeni heder iz [chatId].tsx */}
      <Stack.Screen name="[chatId]" options={{ headerShown: true }} /> 
    </Stack>
  );
}
