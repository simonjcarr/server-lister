import { Card } from 'antd'
import React from 'react'

import { useSession } from 'next-auth/react'

function ListServerCollections() {
  const { data: session } = useSession()



  return (
    <Card title="Server Groups">
      <div>
        <h3>Server Groups</h3>
        <div>

        </div>
      </div>
    </Card>
  )
}

export default ListServerCollections