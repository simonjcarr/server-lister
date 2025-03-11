import ListServerCollections from '@/app/components/server/collections/ListServerCollections'
import { getServerCollections } from '@/app/actions/server/serverCollectionActions'
import React from 'react'

async function ServerCollectionsPage() {
  // Fetch collections data on the server
  const collections = await getServerCollections()

  return (
    <div>
      <ListServerCollections collections={collections} />
    </div>
  )
}

export default ServerCollectionsPage