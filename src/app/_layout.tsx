
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const styleId = 'ventrya-dark-inputs';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;

    style.textContent = `
      input {
        background-color: transparent !important;
        color: #FFFFFF !important;
        caret-color: #C052FF !important;
        color-scheme: dark;
        outline: none;
      }

      input:focus {
        outline: none !important;
        box-shadow: none;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-text-fill-color: #FFFFFF !important;
        -webkit-box-shadow: 0 0 0 1000px #241A30 inset !important;
        box-shadow: 0 0 0 1000px #241A30 inset !important;
        caret-color: #C052FF !important;
        color-scheme: dark !important;
      }

      input::placeholder {
        color: #9987AA;
        opacity: 1;
      }
    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#08050F',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="explore" />
      </Stack>
    </>
  );
}
