'use client';

import React from 'react';
import { Card, Transfer, Button, App } from 'antd';
import type { TransferDirection } from 'antd/es/transfer';
import type { Key } from 'react';
import { FaServer } from 'react-icons/fa';

// This page creates a simple Transfer component with hardcoded data to test the component in isolation
const DebugTransfer = () => {
  const [targetKeys, setTargetKeys] = React.useState<Key[]>(['1', '3']);

  // Example data for Transfer component
  const mockData = [
    {
      key: '1',
      title: 'server-one',
      description: '192.168.1.1 - Production server',
      disabled: false,
    },
    {
      key: '2',
      title: 'server-two',
      description: '192.168.1.2 - Development server',
      disabled: false,
    },
    {
      key: '3',
      title: 'server-three',
      description: '192.168.1.3 - Test server',
      disabled: false,
    },
    {
      key: '4',
      title: 'server-four',
      description: '192.168.1.4 - Staging server',
      disabled: false,
    },
  ];

  // Event handlers for the Transfer component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChange = (nextTargetKeys: Key[], _direction: TransferDirection, _moveKeys: Key[]) => {
    setTargetKeys(nextTargetKeys);
  };

  const handleDumpDatabase = async () => {};

  const filterOption = (inputValue: string, item: { title: string, description: string }) => {
    return item.title.indexOf(inputValue) !== -1 || item.description.indexOf(inputValue) !== -1;
  };

  return (
    <App>
      <div className="container mx-auto p-4">
        <Card title="Debug Transfer Component" className="mb-4">
          <p className="mb-4">
            This is a test page for the Transfer component with hardcoded data.
            Initial target keys are set to [&apos;1&apos;, &apos;3&apos;].
          </p>
          
          <Button onClick={handleDumpDatabase} className="mb-4">Dump Database</Button>
          
          <div className="mb-4">
            <p>Current Target Keys: {targetKeys.join(', ')}</p>
          </div>
          
          <Transfer
            dataSource={mockData}
            titles={['Available Servers', 'Selected Servers']}
            targetKeys={targetKeys}
            onChange={handleChange}
            filterOption={filterOption}
            showSearch
            listStyle={{
              width: '100%',
              height: 300,
            }}
            render={(item) => (
              <div className="flex items-center gap-2">
                <FaServer className="text-blue-500" />
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </App>
  );
};

export default DebugTransfer;