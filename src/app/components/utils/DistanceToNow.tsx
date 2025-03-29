'use client'
import { Popover } from "antd"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"
import { useTheme } from "@/app/theme/ThemeProvider"

const DistanceToNow = ({ date }: { date: Date }) => {
  const [time, setTime] = useState(formatDistanceToNow(date, { addSuffix: true }))
  const { isDarkMode } = useTheme()
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
    <div>
      <Popover 
        content={date.toLocaleDateString() + " " + date.toLocaleTimeString()}
        overlayClassName={isDarkMode ? 'dark-theme-dropdown' : ''}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
      </Popover>
    </div>
  )
}

export default DistanceToNow