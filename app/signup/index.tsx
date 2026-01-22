// app/signup/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('./birthday');
  }, []);

  return null;
}
