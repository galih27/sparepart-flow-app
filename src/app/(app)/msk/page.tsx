import MskClient from '@/components/app/msk-client';
import { mskData, inventoryData } from '@/lib/data';

export default function MskPage() {
  const data = mskData;
  const inventory = inventoryData;

  return <MskClient data={data} inventory={inventory} />;
}
