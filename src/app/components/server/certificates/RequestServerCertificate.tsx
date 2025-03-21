import { Button, Modal } from "antd"
import { PlusOutlined } from "@ant-design/icons"

const RequestServerCertificate = () => {
  return (
    <>
      <Button type="primary" icon={<PlusOutlined />}>Request Certificate</Button>
      <Modal title="Request Server Certificate">
        
      </Modal>
    </>
  )
}

export default RequestServerCertificate