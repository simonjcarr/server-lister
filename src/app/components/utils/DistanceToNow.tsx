'use client'
import { Popover } from "antd"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"

const DistanceToNow = ({ date }: { date: Date }) => {
  const [time, setTime] = useState(formatDistanceToNow(date, { addSuffix: true }))
  useEffect(() => {
    // Calculate initial time
    setTime(formatDistanceToNow(date, { addSuffix: true }))
    
    // Only update every 30 seconds instead of every second
    const interval = setInterval(() => {
      setTime(formatDistanceToNow(date, { addSuffix: true }))
    }, 30000) // 30 seconds interval instead of 1 second
    
    return () => clearInterval(interval)
  }, [date]) // Remove 'time' from dependencies to prevent cascading re-renders
  
  return (
    <div><Popover content={date.toLocaleDateString() + " " + date.toLocaleTimeString()}>{time}</Popover></div>
  )
}

export default DistanceToNow