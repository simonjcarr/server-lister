import { Form, Input, Button, Spin, Alert, Card } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import FormInputSelectLocation from '../location/FormInputSelectLocation'
const FormEditServer = ({ serverId }: { serverId: number }) => {
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
  })
  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Card title={`Server: ${serverData.hostname}`} extra={<Button type="primary" onClick={() => {}}>Edit</Button>}>
          <Form initialValues={serverData}>
            <Form.Item label="Hostname" name="hostname">
              <Input />
            </Form.Item>
            <Form.Item label="IPV4" name="ipv4">
              <Input />
            </Form.Item>
            <Form.Item label="IPV6" name="ipv6">
              <Input />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea />
            </Form.Item>
            <Form.Item label="Doc Link" name="docLink">
              <Input />
            </Form.Item>
            <Form.Item label="Project" name="projectId">
              <Input />
            </Form.Item>
            <Form.Item label="Location" name="locationId">
              <FormInputSelectLocation />
            </Form.Item>
            <Form.Item label="Business" name="business">
              <Input />
            </Form.Item>
            <Form.Item label="OS" name="osId">
              <Input />
            </Form.Item>
            <Form.Item label="ITAR" name="itar">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Update</Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </>
  )
}

export default FormEditServer