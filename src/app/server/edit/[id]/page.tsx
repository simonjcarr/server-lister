'use client'
import FormEditServer from "@/app/components/server/FormEditServer"
import { useParams } from "next/navigation"

const EditServer = () => {
  const params = useParams<{id: string}>()
  return (
    <>
      <FormEditServer serverId={+params.id} />
    </>
  )
}

export default EditServer