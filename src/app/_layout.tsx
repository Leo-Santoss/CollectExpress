import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import ToastContainer from '../components/ui/ToastContainer';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style="dark" />
            <Slot />
            <ToastContainer />
          </View>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
