'use client'
import { Dropdown, MenuProps } from 'antd'
import DisplayNoteInModal from './DisplayNoteInModal'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteServerNote, getNoteById } from '@/app/actions/server/notes/crudServerNoteActions'
import { useSession } from "next-auth/react"

const NoteDropDownMenu = ({ children, noteId, serverId }: { children: React.ReactNode, noteId: number, serverId: number }) => {
  const session = useSession();
  const userId = session?.data?.user.id;
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteServerNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serverNotes", serverId] })
    }
  })
  const { data: note } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNoteById(noteId)
  })

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <DisplayNoteInModal noteId={noteId} />,
    },
    {
      key: '2',
      label: (<span className="text-red-300">Delete</span>),
      disabled: !note || (note.userId !== userId && !session?.data?.user.roles?.includes("admin") ),
      onClick: () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
          mutation.mutate()
        }
      }
    }
  ]
  return (
    <Dropdown menu={{ items }}>
      {children}
    </Dropdown>
  )
}

export default NoteDropDownMenu