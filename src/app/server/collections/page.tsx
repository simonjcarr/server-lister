import React from 'react'
import ListCollections from '@/app/components/server/collections/ListCollections'
import { Card } from 'antd'

export const metadata = {
  title: 'Server Collections',
  description: 'Manage your server collections',
}

async function ServerCollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Server Collections</h1>
      <p className="mb-6 text-gray-600">
        Create and manage collections of servers. Collections help you organize servers 
        into logical groups and make it easier to find and manage related servers.
      </p>
      
      <ListCollections />
    </div>
  )
}

export default ServerCollectionsPage