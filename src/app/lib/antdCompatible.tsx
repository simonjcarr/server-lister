'use client';

import React from 'react';
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';

export function AntdCompatibilityProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      {children}
    </StyleProvider>
  );
}
