import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so a bug in one screen
 * doesn't take down the whole app. Core safety/tracking data already lives
 * in localStore, so a reset here never loses user-entered data.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F6F3EE' }}>
          <Text variant="heading" center>
            Something went wrong
          </Text>
          <Text variant="body" color="secondary" center style={{ marginTop: 8, marginBottom: 24 }}>
            Your data is safe. Try restarting the screen.
          </Text>
          <Button label="Try again" onPress={() => this.setState({ error: null })} />
        </View>
      );
    }
    return this.props.children;
  }
}
