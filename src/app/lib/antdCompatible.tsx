'use client';

import React from 'react';
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';
import { App } from 'antd';

// Following the official approach at https://u.ant.design/v5-for-19
export function AntdCompatibilityProvider({ children }: { children: React.ReactNode }) {
  // Mock React.version to make Ant Design think it's running on React 18
  // This effectively removes the warning message
  const originalVersion = React.version;
  Object.defineProperty(React, 'version', {
    get() {
      return '18.2.0';
    },
    configurable: true,
  });

  // Clean up when unmounting
  React.useEffect(() => {
    return () => {
      Object.defineProperty(React, 'version', {
        get() {
          return originalVersion;
        },
        configurable: true,
      });
    };
  }, [originalVersion]);

  return (
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      <App>
        {children}
      </App>
    </StyleProvider>
  );
}
