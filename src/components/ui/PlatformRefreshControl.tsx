import { Platform } from 'react-native';

/**
 * RefreshControl wrapper that only works on native platforms.
 * On web, react-native-web does not support RefreshControl,
 * so we return undefined to avoid crashes.
 */

let RefreshControlComponent: typeof import('react-native').RefreshControl | undefined;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RefreshControlComponent = require('react-native').RefreshControl;
}

interface PlatformRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
}

export function renderRefreshControl(props: PlatformRefreshControlProps) {
  if (Platform.OS === 'web' || !RefreshControlComponent) {
    return undefined;
  }

  return (
    <RefreshControlComponent
      refreshing={props.refreshing}
      onRefresh={props.onRefresh}
      colors={props.colors}
      tintColor={props.tintColor}
    />
  );
}
