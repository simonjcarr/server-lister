import { Form, Input, Button, Spin, Alert, Card, Select, Row, Col, Typography } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getServerById, updateServer } from "@/app/actions/server/crudActions"
import FormInputSelectLocation from '../location/FormInputSelectLocation'
import { UpdateServer } from '@/db/schema'
import { useRouter } from 'next/navigation'
import FormInputSelectBusiness from '../business/FormInputSelectBusiness'
import FormInputSelectProject from '../project/FormInputSelectProject'
import FormInputSelectOS from '../os/FormInputSelectOS'
import { getIP } from '@/app/actions/utils/getIP';

const { Text } = Typography;

const FormEditServer = ({ serverId }: { serverId: number }) => {
  const router = useRouter()
  const [form] = Form.useForm();
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
  })

  const onFinish = async (values: UpdateServer) => {
    await updateServer(values, serverId);
    router.push(`/server/view/${serverId}`);
  };

  const handleHostnameChange = async (value: string) => {
    try {
      const result = await getIP(value);
      if (result?.ip) {
        form.setFieldsValue({
          ipv4: result.ip
        });
      } else {
        form.setFieldsValue({
          ipv4: ""
        });
      }
    } catch (error) {
      console.error("Error fetching IP:", error);
    }
  };

  return (
    <Card 
      title={`Server: ${serverData?.hostname || 'Loading...'}`} 
      className="dark:bg-gray-800 dark:border-gray-700"
      styles={{
        header: { color: 'inherit' },
        body: { color: 'inherit' }
      }}
    >
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Form 
          form={form}
          initialValues={serverData}
          onFinish={onFinish}
          layout="vertical"
          className="dark:text-white"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item label="Hostname" name="hostname">
                <Input 
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  onChange={(e) => handleHostnameChange(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="IPV4" name="ipv4">
                <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="IPV6" name="ipv6">
                <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Project" name="projectId">
                <FormInputSelectProject />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Location" name="locationId">
                <FormInputSelectLocation />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Business" name="business">
                <FormInputSelectBusiness />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="OS" name="osId">
                <FormInputSelectOS />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ITAR" name="itar">
                <Select
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  options={[
                    { value: false, label: 'No' },
                    { value: true, label: 'Yes' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Button type="primary" htmlType="submit">Update</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Card>
  )
}

export default FormEditServer