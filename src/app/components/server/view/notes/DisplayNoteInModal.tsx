'use client'
import {  Modal} from "antd"
import { useQuery } from "@tanstack/react-query"
import { getNoteById } from "@/app/actions/server/notes/crudServerNoteActions"
import DistanceToNow from "@/app/components/utils/DistanceToNow"
import { useState } from "react"
import DOMPurify from "dompurify"

const DisplayNoteInModal = ({ noteId }: { noteId: number }) => {
  const { data: note, isLoading, error } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNoteById(noteId),
    enabled: !!noteId
  })

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <div className="size" onClick={showModal}>
        View
      </div>
      <Modal title={note && (
        <div className="flex justify-between font-semibold">
          <div>{note?.userName}</div>
          <div><DistanceToNow date={note?.createdAt} /></div>
        </div>
      )} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
      <>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {note && (
        <>
          {/* Only the first 40 characters of the note should be displayed */}
          <div className="whitespace-pre-line max-h-[300px] overflow-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note?.note.replace(/\n/g, "<br />")) }}></div>
        </>
      )}
      </>
    </Modal>
    </>
  )
}

export default DisplayNoteInModal