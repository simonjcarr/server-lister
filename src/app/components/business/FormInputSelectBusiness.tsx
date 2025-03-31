import { Select } from 'antd'
import { getBusinesses } from '@/app/actions/business/crudActions'
import { useQuery } from '@tanstack/react-query'

interface FormInputSelectBusinessProps {
  value?: number;
  onChange?: (value: number) => void;
}

const FormInputSelectBusiness = ({ value, onChange }: FormInputSelectBusinessProps) => {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getBusinesses(),
  })
  return (
    <Select
      value={value}
      onChange={onChange}
      loading={isLoading}
      placeholder="Select a business"
      options={businesses?.map((business) => ({
        value: business.id,
        label: business.name,
      }))}
    />
  )
}

export default FormInputSelectBusiness