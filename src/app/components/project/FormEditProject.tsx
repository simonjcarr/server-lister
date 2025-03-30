"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Card, Select, App } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectById, updateProject } from "@/app/actions/projects/crudActions";
import type { ProjectFormData } from "@/app/actions/projects/crudActions";
import { getBusinesses } from "@/app/actions/business/crudActions";

const { TextArea } = Input;

const FormEditProject = ({ projectId }: { projectId: number }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  // Fetch businesses for dropdown
  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getBusinesses(),
    staleTime: 60 * 1000,
  });

  // Update form values when project data is loaded
  useEffect(() => {
    if (project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        business: project.businessId,
        code: project.code,
      });
    }
  }, [project, form]);

  // Update project mutation
  const mutation = useMutation({
    mutationFn: async (values: ProjectFormData) => {
      return updateProject(projectId, values);
    },
    onSuccess: (result) => {
      if (result.success) {
        message.success("Project updated successfully");
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        router.push(`/project/${projectId}`);
      } else {
        message.error(`Failed to update project: ${result.error}`);
      }
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      message.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onFinish = (values: ProjectFormData) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  const handleCancel = () => {
    router.push(`/project/${projectId}`);
  };

  if (isLoadingProject) {
    return <div>Loading project data...</div>;
  }

  return (
    <>
      <Card title="Edit Project" className="max-w-3xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: "",
            description: "",
            business: undefined,
            code: "",
          }}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: "Please enter the project name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item name="business" label="Business">
            <Select
              loading={isLoadingBusinesses}
              allowClear
              placeholder="Select a business"
              options={
                businesses?.map((business) => ({
                  value: business.id,
                  label: business.name,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item name="code" label="Project Code">
            <Input />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Update Project
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default FormEditProject;
