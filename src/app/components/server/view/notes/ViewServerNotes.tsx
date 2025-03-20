'use client'
import TextArea from "antd/es/input/TextArea"
import { useQuery } from "@tanstack/react-query"
import { getServerNotes } from "@/app/actions/server/notes/crudServerNoteActions"


const ViewServerNotes = ({ serverId }: { serverId: number }) => {
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["serverNotes", serverId],
    queryFn: () => getServerNotes(serverId),
    enabled: !!serverId
  })
  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!notes) return <p>No notes found</p>
  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Server notes list grows to take up remaining space */}
      <div className="flex-1 grow overflow-auto">
        {notes.map((note) => (
          <div key={note.id} className="mb-4">
            <div className="flex justify-between">
              <p>{note.userId}</p>
              <p>{note.createdAt.toLocaleDateString()}</p>
            </div>
            <p className="mt-2 text-gray-200">{note.note}</p>
          </div>
        ))}
      </div>
      {/* TextArea remains at the bottom */}
      <div className="mt-auto">
        <TextArea rows={5} placeholder="Add a note" />
      </div>
    </div>
  )
}

export default ViewServerNotes