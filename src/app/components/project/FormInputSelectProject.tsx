import { Select } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getProjects } from '@/app/actions/projects/crudActions';

interface FormInputSelectProjectProps {
  value?: number;
  onChange?: (value: number) => void;
}

const FormInputSelectProject = ({ value, onChange }: FormInputSelectProjectProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  })
  return (
    <Select
      value={value}
      onChange={onChange}
      loading={isLoading}
      placeholder="Select a project"
      options={projects?.map((project) => ({
        value: project.id,
        label: project.name,
      }))}
    />
  )
}

export default FormInputSelectProject