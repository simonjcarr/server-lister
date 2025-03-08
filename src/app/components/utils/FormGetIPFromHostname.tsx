'use client'
import { Button, Input } from 'antd'
import React, { useState } from 'react'

function FormGetIPFromHostname() {
  const [ip, setIp] = useState('');
  const [hostname, setHostname] = useState('');
  
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHostname(e.target.value);
    setIp('');
  }

  const getIP = async () => {
    const response = await fetch(`/api/getip/${hostname}`);
    const data = await response.json();
    setIp(data.ip);
  }
  return (
    <div>
      <div>Hostname</div>
      <Input placeholder="Enter hostname" value={hostname} onKeyDown={(e) => e.key === 'Enter' && getIP()} onChange={handleOnChange} />
      <Button onClick={() => getIP()}>Get IP</Button>
      <div>IP Result: {ip && `${hostname} => ${ip}`}</div>
    </div>
  )
}

export default FormGetIPFromHostname