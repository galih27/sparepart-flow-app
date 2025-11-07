import ReportStockClient from '@/components/app/report-stock-client';
import { inventoryData } from '@/lib/data';

export default function ReportStockPage() {
  // In a real app, this data would be fetched from an API
  const data = inventoryData;

  return <ReportStockClient data={data} />;
}
