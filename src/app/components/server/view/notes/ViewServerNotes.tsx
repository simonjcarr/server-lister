import TextArea from "antd/es/input/TextArea"

const ViewServerNotes = () => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Server notes list grows to take up remaining space */}
      <div className="flex-grow overflow-auto">
        Server Notes list goes here
      </div>
      {/* TextArea remains at the bottom */}
      <div className="w-full">
        <TextArea rows={5} placeholder="Add a note" />
      </div>
    </div>
  )
}

export default ViewServerNotes