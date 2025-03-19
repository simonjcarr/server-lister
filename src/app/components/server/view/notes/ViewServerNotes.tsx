import TextArea from "antd/es/input/TextArea"

const notes = [
  {
    id: 1,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date()
  },{
    id: 2,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date() 
  },
  {
    id: 7,
    note: "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date() 
  }
]
const ViewServerNotes = () => {
 
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