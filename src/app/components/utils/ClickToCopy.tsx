import { CopyOutlined } from '@ant-design/icons';
const ClickToCopy = ({ text }: { text: string }) => {
  const handleCopy = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <span className='flex items-center gap-1'>
      {text}
      {text && (
        <CopyOutlined
          className='opacity-50 hover:opacity-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-opacity'
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(text);
          }}
        />
      )}
    </span>
  )
}

export default ClickToCopy