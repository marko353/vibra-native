import { Redirect } from "expo-router";

export default function Index() {
  // Automatski preusmerava korisnika na login stranu
  return <Redirect href="/(auth)/login" />;
}