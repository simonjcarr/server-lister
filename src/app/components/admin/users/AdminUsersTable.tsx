"use client";
import { Card, Row, Col, Spin, Alert, Tag, Table } from 'antd'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/app/actions/users/userActions'
import { ColumnsType } from 'antd/es/table'
import { SelectUser } from '@/db/schema'
import AdminDisplayUser from './AdminDisplayUser';

// Define a type for the table data that includes the key
type UserTableRecord = SelectUser & { key: string };

interface DisplayUserRolesProps {
  roles: unknown;
}

function DisplayUserRoles({ roles }: DisplayUserRolesProps) {
  
  // Safely handle the roles data which might be in different formats
  const roleArray = Array.isArray(roles) ? roles : 
                  typeof roles === 'string' ? [roles] : 
                  [];

  return (
    <span>
      {roleArray.sort().map((role, index) => (
        <Tag color="blue" key={index}>{role}</Tag>
      ))}
      {roleArray.length === 0 && <Tag color="red">No roles</Tag>}
    </span>
  );
}

function AdminUsersTable() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await getAllUsers();
      
      // Check if result is an error object (has success property and it's false)
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      
      // If we got here, result should be an array of users
      return Array.isArray(result) 
        ? result.map(user => ({ ...user, key: user.id })) as UserTableRecord[]
        : [];
    }
  });

  // Define columns with the correct type
  const columns: ColumnsType<UserTableRecord> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email && b.email) ? a.email.localeCompare(b.email) : 0,
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0,
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => <DisplayUserRoles roles={roles} />
    }
  ];
  return (
    <Card title="Users">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          {isPending ? (
            <Spin />
          ) : error ? (
            <Alert 
              message="Error" 
              description={error instanceof Error ? error.message : 'An error occurred'} 
              type="error" 
            />
          ) : (
            <Table 
            onRow={(record) => ({
              onClick: () => {
                setSelectedUserId(record.id);
              }
            })}
            columns={columns} 
            dataSource={data} 
            size='small' />
          )}
        </Col>
        <Col span={12}>
          {selectedUserId && (
            <AdminDisplayUser userId={selectedUserId} />
          )}
        </Col>
      </Row>
    </Card>
  )
}

export default AdminUsersTable
