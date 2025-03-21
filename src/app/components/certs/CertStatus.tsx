import React from 'react'

const CertStatus = ({ cert }: { cert: "Pending" | "Ordered" | "Ready" }) => {
  return (
    <span className={`${cert === "Pending" ? "text-yellow-500" : cert === "Ordered" ? "text-blue-500" : "text-green-500"} capitalize`}>{cert}</span>
  )
}

export default CertStatus