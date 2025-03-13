import { getUserById, updateUserRoles } from '@/app/actions/users/userActions';
import type { SelectUser } from '@/db/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Select, Space, Spin } from 'antd';



const options = [
  {
    label: 'User',
    value: 'user',
    emoji: '👤',
    desc: 'User',
  },
  {
    label: 'Admin',
    value: 'admin',
    emoji: '🛠️',
    desc: 'Admin',
  },
  {
    label: 'Certs',
    value: 'certs',
    emoji: '📜',
    desc: 'Certs',
  }
];

function AdminUserRoles({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const { data, error, isPending } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const response = await getUserById(userId)
      return Array.isArray(response) ? response[0] as SelectUser : null
    }
  })
  const handleChange = async (value: string[]) => {
    await updateUserRoles(userId, value)
    // Invalidate the specific user query
    queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
    // Also invalidate the users table query to refresh the table
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }
  return (
    <>
      {isPending ? (
        <Spin />
      ) : error ? (
        <Alert
          message="Error"
          description={error instanceof Error ? error.message : 'An error occurred'}
          type="error"
        />
      ) : (
        <Select
          mode="multiple"
          className='w-full'
          placeholder="Select Roles"
          defaultValue={data?.roles.sort() || ['user']}
          onChange={handleChange}
          options={options}
          optionRender={(option) => (
            <Space>
              <span role="img" aria-label={option.data.label}>
                {option.data.emoji}
              </span>
              {option.data.desc}
            </Space>
          )}
        />
      )}
    </>
  )
}

export default AdminUserRoles
