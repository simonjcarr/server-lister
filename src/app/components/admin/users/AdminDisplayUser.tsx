'use client'
import { getUserById } from '@/app/actions/users/userActions'
import { SelectUser } from '@/db/schema'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Spin, Alert } from 'antd'
import AdminUserRoles from './AdminUserRoles'

function AdminDisplayUser({ userId }: { userId: string }) {
  const { data, error, isPending } = useQuery({
    queryKey: ['admin','user', userId],
    queryFn: async () => {
      const response = await getUserById(userId)
      return Array.isArray(response) ? response[0] as SelectUser : null
    }
  })
  return (
    <Card title="User Details" extra={data?.email}>
      <Row>
        <Col span={24}>
          {isPending ? (
            <Spin />
          ) : error ? (
            <Alert 
              message="Error" 
              description={error instanceof Error ? error.message : 'An error occurred'} 
              type="error" 
            />
          ) : (
            <div className='flex flex-col gap-2'>
              <p>Email: {data?.email}</p>
              <p>Name: {data?.name}</p>
              <div className='flex gap-2 w-full'>
                <p>Roles: </p>
                <AdminUserRoles userId={userId} />
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  )
}

export default AdminDisplayUser