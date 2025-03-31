'use client'
import FormEditServer from "@/app/components/server/FormEditServer"
import { useParams } from "next/navigation"

const EditServer = () => {
  const params = useParams<{id: string}>()
  return (
    <>
      <FormEditServer serverId={+params.id}>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit Server</button>
      </FormEditServer>
    </>
  )
}

export default EditServer