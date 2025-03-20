'use client'
import TextArea from "antd/es/input/TextArea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addServerNote, getServerNotes } from "@/app/actions/server/notes/crudServerNoteActions"
import { useState } from "react"
import { Button } from "antd"
import DistanceToNow from "@/app/components/utils/DistanceToNow"


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
          <div key={note.id} className="mb-4">
            <div className="flex justify-between">
              <p>{note.userName}</p>
              <p><DistanceToNow date={note.createdAt} /></p>
            </div>
            <p className="mt-2 text-gray-200">{note.note}</p>
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