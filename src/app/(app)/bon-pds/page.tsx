import BonPdsClient from '@/components/app/bon-pds-client';
import { bonPdsData, inventoryData } from '@/lib/data';

export default function BonPdsPage() {
  const data = bonPdsData;
  const inventory = inventoryData;

  return <BonPdsClient data={data} inventory={inventory} />;
}
