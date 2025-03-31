import FormAddServer from "@/app/components/server/FormAddServer"
import { Button } from 'antd'
import React from 'react'

function Page() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Add Server</h1>
      <FormAddServer>
        <Button type="primary">Add New Server</Button>
      </FormAddServer>
    </div>
  )
}

export default Page