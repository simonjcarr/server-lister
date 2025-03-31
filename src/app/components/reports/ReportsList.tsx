'use client'
import { Table } from 'antd';
import { useRouter } from 'next/navigation';


const ReportsList = () => {
  const router = useRouter();
  const columns = [
    {
      key: 'name',
      title: 'name',
      dataIndex: 'name',
      render: (text: string, record: { id: number, name: string, link: string }) => (<div className='cursor-pointer hover:text-gray-600' onClick={() => router.push(record.link)}>{text}</div>),
      
    }
  ]
  const data = [
    {
      id: 1,
      name: 'Server Patch Status',
      link: '/reports/report/server_patch_status'
    },
    {
      id: 2,
      name: 'Booking Code Status',
      link: '/reports/report/booking_code_status'
    },
    {
      id: 3,
      name: 'Report 3',
      link: '/reports/report_3'
    }
  ]
  return (
    <Table columns={columns} dataSource={data} size="small" rowKey="id" />
  )
}

export default ReportsList