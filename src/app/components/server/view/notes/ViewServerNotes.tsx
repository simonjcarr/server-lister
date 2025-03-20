'use client'
import TextArea from "antd/es/input/TextArea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addServerNote, getServerNotes } from "@/app/actions/server/notes/crudServerNoteActions"
import { useState } from "react"
import { Button } from "antd"
import DistanceToNow from "@/app/components/utils/DistanceToNow"
import DisplayNoteInModal from "@/app/components/server/view/notes/DisplayNoteInModal"

const ViewServerNotes = ({ serverId }: { serverId: number }) => {
  const [noteText, setNoteText] = useState("")
  const queryClient = useQueryClient()
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["serverNotes", serverId],
    queryFn: () => getServerNotes(serverId),
    enabled: !!serverId
  })
  const mutation = useMutation({
    mutationFn: (note: string) => addServerNote(note, serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serverNotes", serverId] })
    }
  })

  const handleAddNote = () => {
    mutation.mutate(noteText)
    setNoteText("")
  }
  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!notes) return <p>No notes found</p>
  return (
    <div className="flex flex-col max-h-[80vh]">
      <div className="flex-1 grow overflow-auto">
        {notes.map((note) => (
          <div key={note.id} className="mb-4 border-b pb-4 hover:bg-gray-800 cursor-pointer">
            <div className="flex justify-between font-semibold">
              <div>{note.userName}</div>
              <div className="flex gap-2">
                <DistanceToNow date={note.createdAt} />
                <DisplayNoteInModal noteId={note.id} />
              </div>
            </div>
            <div className="mt-2 text-gray-200">{note.note?.slice(0, 40)}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto">
        <TextArea rows={5} placeholder="Add a note" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
        <Button className="block w-full" onClick={handleAddNote}>Add Note</Button>
      </div>
    </div>
  )
}

export default ViewServerNotes