import { Button, Drawer, Form, Input } from "antd"
import { useState } from "react"

const CreateNewServerActionForm = () => {
  const [open, setOpen] = useState(false)
  const onFinish = (values: { title: string; description: string }) => {
    console.log('Received values of form:', values)
  }
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
          onFinish={onFinish}
        >
          <Form.Item
            name="title"
            label="Action Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button type="primary" htmlType="submit">Create</Button>
          </Form.Item>
        </Form>
      </div>
    </Drawer>
    </div>
  )
}

export default CreateNewServerActionForm