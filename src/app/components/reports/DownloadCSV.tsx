import { json2csv } from 'json-2-csv';
const DownloadCSV = ({ children, data }: { children: React.ReactNode, data: object[] }) => {
  const handleDownload = () => {
  const csv = json2csv(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'report.csv';
  link.click();
  URL.revokeObjectURL(url);
  }

  return (
    <>
      <span onClick={handleDownload} className='cursor-pointer hover:text-blue-500'>{children}</span>
    </>
  )
}

export default DownloadCSV