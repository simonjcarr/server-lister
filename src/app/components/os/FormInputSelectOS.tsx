import { Select } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getOS } from "@/app/actions/os/crudActions"

interface FormInputSelectOSProps {
  value?: number;
  onChange?: (value: number) => void;
}

const FormInputSelectOS = ({ value, onChange }: FormInputSelectOSProps) => {
  const { data: os, isLoading } = useQuery({
    queryKey: ["os"],
    queryFn: () => getOS(),
  })
  return (
    <Select
      value={value}
      onChange={onChange}
      loading={isLoading}
      placeholder="Select an OS"
      options={os?.map((os) => ({
        value: os.id,
        label: os.name,
      }))}
    />
  )
}


export default FormInputSelectOS