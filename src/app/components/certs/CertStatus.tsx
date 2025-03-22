import React from 'react'

const CertStatus = ({ status }: { status: "Pending" | "Ordered" | "Ready" }) => {
  return (
    <span className={`${status === "Pending" ? "text-yellow-500" : status === "Ordered" ? "text-blue-500" : "text-green-500"} capitalize`}>{status}</span>
  )
}

export default CertStatus