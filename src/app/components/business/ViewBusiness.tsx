import { Card } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getBusinessById } from "@/app/actions/business/crudActions"

const ViewBusiness = ({ businessId }: { businessId: number }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => getBusinessById(businessId),
    enabled: !!businessId,
  })
  return (
    <Card title="Business">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Name: {data.name}</p>}
    </Card>
  )
}

export default ViewBusiness