import { SubTask } from '@/types'
import { Switch, Modal, message as antdMessage } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import React from 'react'
import { toggleSubTaskComplete, deleteSubTask } from '@/app/actions/serverTasks/crudSubTasks'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import SubTaskAssignedTo from './SubTaskAssignedTo'
import EditServerSubTaskForm from './EditServerSubTaskForm'
import SubTaskActionsDropdown from './SubTaskActionsDropdown'

const DisplaySubTaskDetail = ({ subTask }: { subTask: SubTask }) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: toggleSubTaskComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTasks", subTask.taskId] })
    }
  })

  // Edit drawer state
  const [editOpen, setEditOpen] = React.useState(false)
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  // Delete mutation
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const deleteMutation = useMutation({
    mutationFn: deleteSubTask,
    onSuccess: () => {
      messageApi.success('Subtask deleted')
      queryClient.invalidateQueries({ queryKey: ["subTasks", subTask.taskId] })
    }
  })

  // State to control showing the assign UI
  const [showAssign] = React.useState(false)

  return (
    <div className='px-4'>
      {contextHolder}
      <div className="flex justify-between mb-2">
        <div className="text-xl font-bold">{subTask.title}</div>
        <div className='flex gap-2 items-center'>
          <SubTaskActionsDropdown
            subTask={subTask}
            onEdit={() => setEditOpen(true)}
            onToggleComplete={() => mutation.mutate(subTask.id)}
            onDelete={() => setDeleteModalOpen(true)}
          />
          <div>{subTask.isComplete ? <span className="text-green-500 text-lg">Task complete</span> : 'Task Open'}</div>
          <Switch
            className="text-green-500"
            checked={subTask.isComplete}
            onChange={() => mutation.mutate(subTask.id)}
          />
        </div>
      </div>
      <SubTaskAssignedTo subTask={subTask} showChangeUser={showAssign} />
      <div className='mt-2 whitespace-pre-wrap break-words'>{subTask.description}</div>
      {/* Only render the edit form when editOpen is true to avoid useForm warning */}
      {editOpen && (
        <EditServerSubTaskForm subTask={subTask} open={editOpen} onClose={() => setEditOpen(false)} taskId={subTask.taskId} />
      )}
      <Modal
        open={deleteModalOpen}
        title={<span style={{ color: 'red', fontWeight: 600 }}>Delete Subtask</span>}
        onOk={() => {
          deleteMutation.mutate(subTask.id)
          setDeleteModalOpen(false)
        }}
        onCancel={() => setDeleteModalOpen(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '16px 0' }}>
          <ExclamationCircleOutlined style={{ color: 'red', fontSize: 44, marginBottom: 8 }} />
          <div style={{ textAlign: 'center', fontSize: 18, lineHeight: 1.6 }}>
            Are you sure you want to <span style={{ color: 'red', fontWeight: 600 }}>delete</span> this subtask?<br />
            <span style={{ color: '#888' }}>This action cannot be undone.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DisplaySubTaskDetail