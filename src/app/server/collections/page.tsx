import ListServerCollections from '@/app/components/server/collections/ListServerCollections'
import { getServerCollections } from '@/app/actions/server/serverCollectionActions'
import React from 'react'

async function ServerCollectionsPage() {
  return (
    <div>
      <ListServerCollections />
    </div>
  )
}

export default ServerCollectionsPage