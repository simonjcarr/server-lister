'use client'

import { NotificationProvider as Provider } from './NotificationContext'
import { ReactNode } from 'react'

export default function NotificationProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
