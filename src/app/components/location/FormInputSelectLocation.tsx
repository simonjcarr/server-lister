'use client'
import { Select } from 'antd'
import { getLocations } from '@/app/actions/location/crudActions'
import { useQuery } from '@tanstack/react-query'

interface FormInputSelectLocationProps {
  value?: number;
  onChange?: (value: number) => void;
}

const FormInputSelectLocation = ({ value, onChange }: FormInputSelectLocationProps) => {
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getLocations(),
  })
  return (
    <Select
      value={value}
      onChange={onChange}
      loading={isLoading}
      placeholder="Select a location"
      options={locations?.map((location) => ({
        value: location.id,
        label: location.name,
      }))}
    />
  )
}

export default FormInputSelectLocation