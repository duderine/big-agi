import * as React from 'react';

import { Box } from '@mui/joy';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';





/**
 * Purpose selector for the current chat - MINIMAL VERSION
 * All UI elements removed for a clean, empty chat screen
 */
export function PersonaSelector(props: {
  conversationId: DConversationId,
  isMobile: boolean,
  runExample: (example: any) => void,
}) {
  // Empty component - returns minimal box for layout purposes
  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} />
  );
}
