import { Button, Drawer, Form, Input } from "antd"
import { useState } from "react"

const CreateNewServerActionForm = () => {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button ghost onClick={() => setOpen(true)}>New Action</Button>
      </div>
      <Drawer
        title="Create new server action"
        placement="right"
        width={400}
        onClose={() => setOpen(false)}
        open={open}
    >
      <div>
        <Form
          layout="vertical"
          form={form}
          onFinish={form.submit}
        >
          <Form.Item
            name="title"
            label="Action Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </div>
    </Drawer>
    </div>
  )
}

export default CreateNewServerActionForm