'use client';

import React from 'react';
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';

// Fix for React 19 compatibility with Ant Design
export function AntdCompatibilityProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      <ConfigProvider
        // Avoid theme token conflicts
        cssVar={{
          prefix: 'antd',
        }}
        // Set compatibility mode
        component={{
          // Using higher quality CSS transforms
          button: {
            style: { display: 'inline-flex', alignItems: 'center' },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
