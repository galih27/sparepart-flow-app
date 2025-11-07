import MskClient from '@/components/app/msk-client';
import { mskData } from '@/lib/data';

export default function MskPage() {
  const data = mskData;

  return <MskClient data={data} />;
}
