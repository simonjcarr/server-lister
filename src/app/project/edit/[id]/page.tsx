"use client";
import FormEditProject from "@/app/components/project/FormEditProject";
import { useParams } from "next/navigation";
import { App } from "antd";

const EditProject = () => {
  const params = useParams<{id: string}>();
  
  return (
    <>
      <App>
        <FormEditProject projectId={Number(params.id)} />
      </App>
    </>
  );
};

export default EditProject;
