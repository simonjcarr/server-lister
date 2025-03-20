'use client'
import { formatDistanceToNow } from "date-fns"
import { useEffect, useState } from "react"

const DistanceToNow = ({ date }: { date: Date }) => {
  const [time, setTime] = useState(formatDistanceToNow(date, { addSuffix: true }))
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = formatDistanceToNow(date, { addSuffix: true })
      if (newTime !== time) {
        setTime(newTime)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [date, time])
  return (
    <div>{time}</div>
  )
}

export default DistanceToNow