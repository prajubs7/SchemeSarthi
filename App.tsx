import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { store } from './src/store';
import { AlertProvider } from './src/components/common/AlertProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  useEffect(() => {
    console.log('========== TEST LOG ==========');
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AlertProvider>
            <RootNavigator />
          </AlertProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
