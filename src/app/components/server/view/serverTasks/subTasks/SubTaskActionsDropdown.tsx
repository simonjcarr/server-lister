import React from 'react'
import { Dropdown } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
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
    <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#222',
        color: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        border: '1px solid #444',
        transition: 'background 0.2s',
      }}>
        <EllipsisOutlined style={{ fontSize: 22 }} />
      </div>
    </Dropdown>
  )
}

export default SubTaskActionsDropdown
