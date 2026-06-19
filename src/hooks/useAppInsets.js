import { useSafeAreaInsets } from 'react-native-safe-area-context';
import spacing from '../theme/spacing';

const TAB_BAR_BASE_HEIGHT = 56;

export function useAppInsets() {
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, spacing.sm);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + bottomPadding;

  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    bottomPadding,
    tabBarHeight,
    tabBarBaseHeight: TAB_BAR_BASE_HEIGHT,
  };
}
