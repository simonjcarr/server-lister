import React from 'react'
import { Dropdown, Button } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { SubTask } from '@/types'

interface SubTaskActionsDropdownProps {
  subTask: SubTask
  onEdit: () => void
  onToggleComplete: () => void
  onDelete: () => void
}

const SubTaskActionsDropdown: React.FC<SubTaskActionsDropdownProps> = ({ subTask, onEdit, onToggleComplete, onDelete }) => {
  const menuItems = [
    { key: 'edit', label: 'Edit' },
    { key: 'toggle', label: subTask.isComplete ? 'Mark as Incomplete' : 'Mark as Complete' },
    { key: 'delete', label: 'Delete', danger: true },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'edit') onEdit()
    if (key === 'toggle') onToggleComplete()
    if (key === 'delete') onDelete()
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button size="small" ghost>
        Actions <DownOutlined />
      </Button>
    </Dropdown>
  )
}

export default SubTaskActionsDropdown
