import BonPdsClient from '@/components/app/bon-pds-client';
import { bonPdsData } from '@/lib/data';

export default function BonPdsPage() {
  const data = bonPdsData;

  return <BonPdsClient data={data} />;
}
