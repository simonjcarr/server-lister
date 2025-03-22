import { Dropdown, MenuProps } from 'antd'
import React from 'react'
import ViewCertificateModal from './ViewCertificateModal'

const CertDropDownMenu = ({ children, certId }: { children: React.ReactNode, certId: number }) => {
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <ViewCertificateModal certId={certId} />,
    },
  ]
  return (
    <Dropdown menu={{ items }}>
      {children}
    </Dropdown>
  )
}

export default CertDropDownMenu