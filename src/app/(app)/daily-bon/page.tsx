import DailyBonClient from '@/components/app/daily-bon-client';
import { dailyBonData, usersData } from '@/lib/data';

export default function DailyBonPage() {
  // In a real app, this data would be fetched from an API
  const data = dailyBonData;
  const users = usersData;

  return <DailyBonClient data={data} users={users} />;
}
