'use client';

import { createContext } from 'react';

// Standalone website previews do not have an entrance to wait for.
export const EntranceReadyContext = createContext(true);
