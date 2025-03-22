import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useState } from 'react';

const ClickToCopy = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      messageApi.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
    {contextHolder}
    <span className='flex items-center gap-1'>
      {text}
      {text && (
        <span onClick={handleCopy} className='cursor-pointer'>
          {copied ? (
            <CheckOutlined style={{ color: 'green' }} />
          ) : (
            <CopyOutlined className='opacity-50 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity' />
          )}
        </span>
      )}
    </span>
    </>
  );
};

export default ClickToCopy