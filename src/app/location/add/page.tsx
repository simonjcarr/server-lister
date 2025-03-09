import React from 'react';
import FormAddLocation from '@/app/components/location/FormAddLocation';
import { Card, Typography, Tit } from 'antd';

const { Title } = Typography;

export default function AddLocationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <FormAddLocation />
    </div>
  );
}