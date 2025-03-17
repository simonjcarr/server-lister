import { Form, Input, Button, Spin, Alert, Card, Select } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getServerById, updateServer } from "@/app/actions/server/crudActions"
import FormInputSelectLocation from '../location/FormInputSelectLocation'
import { UpdateServer } from '@/db/schema'
import { useRouter } from 'next/navigation'
import FormInputSelectBusiness from '../business/FormInputSelectBusiness'
import FormInputSelectProject from '../project/FormInputSelectProject'
import FormInputSelectOS from '../os/FormInputSelectOS'

const FormEditServer = ({ serverId }: { serverId: number }) => {
  const router = useRouter()
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
  })

  const onFinish = async (values: UpdateServer) => {
    await updateServer(values, serverId);
    router.push(`/server/view/${serverId}`);
  };

  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Card title={`Server: ${serverData.hostname}`} extra={<Button type="primary" onClick={() => {}}>Edit</Button>}>
          <Form 
          initialValues={serverData}
            onFinish={onFinish}
            >
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
              <FormInputSelectProject />
            </Form.Item>
            <Form.Item label="Location" name="locationId">
              <FormInputSelectLocation />
            </Form.Item>
            <Form.Item label="Business" name="business">
              <FormInputSelectBusiness />
            </Form.Item>
            <Form.Item label="OS" name="osId">
              <FormInputSelectOS />
            </Form.Item>
            <Form.Item label="ITAR" name="itar">
              <Select
                value={serverData.itar}
                options={[
                  { value: false, label: 'No' },
                  { value: true, label: 'Yes' },
                ]}
              />
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