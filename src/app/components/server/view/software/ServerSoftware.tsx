import { useQuery } from "@tanstack/react-query"
import { getServerSoftwareWithWhitelist } from "@/app/actions/scan/softwareWhitelistActions"
import { Alert, Empty, Form, Input, Spin, Table, Switch, Tooltip, Badge, Tag, message } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons"

interface SoftwareWithWhitelist {
  name: string;
  scannedVersion: string;
  latestWhitelistVersion: string | null;
  isUpToDate: boolean;
  daysOutOfDate: number | null;
  installLocation: string;
}

const ServerSoftware = ({ serverId }: { serverId: number }) => {
  const [searchName, setSearchName] = useState('')
  const [filterByWhitelist, setFilterByWhitelist] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()
  
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", "software", serverId, filterByWhitelist],
    queryFn: () => getServerSoftwareWithWhitelist(serverId, filterByWhitelist),
    enabled: !!serverId,
    // Add refetch on filter state change
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
  
  const columns: ColumnsType<SoftwareWithWhitelist> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: SoftwareWithWhitelist, b: SoftwareWithWhitelist) => 
        a.name.localeCompare(b.name),
    },
    {
      title: "Scanned Version",
      dataIndex: "scannedVersion",
      key: "scannedVersion",
    },
    {
      title: "Latest Whitelist Version",
      dataIndex: "latestWhitelistVersion",
      key: "latestWhitelistVersion",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Up To Date",
      dataIndex: "isUpToDate",
      key: "isUpToDate",
      render: (isUpToDate: boolean, record: SoftwareWithWhitelist) => {
        // Only render status if there is a whitelist version to compare against
        if (record.latestWhitelistVersion) {
          return isUpToDate ? 
            <Badge status="success" text={<CheckCircleOutlined style={{ color: 'green' }} />} /> : 
            <Badge status="error" text={<CloseCircleOutlined style={{ color: 'red' }} />} />;
        }
        return "-";
      },
      filters: [
        { text: 'Up to date', value: true },
        { text: 'Out of date', value: false },
      ],
      onFilter: (value, record: SoftwareWithWhitelist) => {
        // Only apply filter to records with a whitelist version
        if (record.latestWhitelistVersion) {
          return record.isUpToDate === value;
        }
        // For records with no whitelist version, don't include them in either filter
        return false;
      },
    },
    {
      title: "Days Out of Date",
      dataIndex: "daysOutOfDate",
      key: "daysOutOfDate",
      render: (days: number | null) => {
        if (days === null) return "-";
        
        // Color coding based on days out of date
        let color = "green";
        if (days > 90) color = "red";
        else if (days > 30) color = "orange";
        else if (days > 0) color = "gold";
        
        return days > 0 ? <Tag color={color}>{days}</Tag> : "-";
      },
      sorter: (a: SoftwareWithWhitelist, b: SoftwareWithWhitelist) => {
        // Handle null values in the sort
        if (a.daysOutOfDate === null && b.daysOutOfDate === null) return 0;
        if (a.daysOutOfDate === null) return 1; // null values at the end
        if (b.daysOutOfDate === null) return -1;
        return a.daysOutOfDate - b.daysOutOfDate;
      },
    }
  ]
  
  return (
    <div>
      {contextHolder}
      <div className="text-2xl font-bold mb-4">Software</div>
      <div className="mb-4 flex items-center justify-between">
        <Form layout="inline" className="w-full space-y-2 md:space-y-0">
          <Form.Item className="w-full md:w-auto" name="name">
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Search..." 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
            />
          </Form.Item>
          <Form.Item label="Show Whitelist Only" className="w-full md:w-auto">
            <Tooltip title="Toggle to show all software or only software in the whitelist">
              <Switch 
                checked={filterByWhitelist} 
                onChange={setFilterByWhitelist} 
                checkedChildren="Whitelist Only" 
                unCheckedChildren="All Software" 
              />
            </Tooltip>
          </Form.Item>
        </Form>
      </div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && Array.isArray(data) && data.length > 0 ? (
        <Table 
          columns={columns} 
          dataSource={data.filter((item) => 
            item && item.name && item.name.toLowerCase().includes(searchName.toLowerCase())
          )} 
          rowKey="name" 
          size="small"
        />
      ) : (
        !isLoading && !error && <Alert message="Info" description="No software found" type="info" />
      )}
    </div>
  )
}

export default ServerSoftware