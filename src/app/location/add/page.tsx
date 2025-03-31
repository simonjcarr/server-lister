import React from 'react';
import FormAddLocation from '@/app/components/location/FormAddLocation';
import { Button } from 'antd';

export default function AddLocationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Add Location</h1>
      <FormAddLocation>
        <Button type="primary">Add New Location</Button>
      </FormAddLocation>
    </div>
  );
}