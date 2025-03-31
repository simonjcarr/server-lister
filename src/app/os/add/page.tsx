import FormAddOS from '@/app/components/os/FormAddOS'
import React from 'react'
import { Button } from 'antd'

function Page() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Operating Systems</h1>
      <FormAddOS>
        <Button type="primary">Add New Operating System</Button>
      </FormAddOS>
    </div>
  )
}

export default Page