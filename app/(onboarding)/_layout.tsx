import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basics" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="baseline" />
      <Stack.Screen name="triggers" />
      <Stack.Screen name="motivation" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
