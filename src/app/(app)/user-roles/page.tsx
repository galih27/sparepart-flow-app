import UserRolesClient from '@/components/app/user-roles-client';
import { usersData } from '@/lib/data';

export default function UserRolesPage() {
  const data = usersData;

  return <UserRolesClient data={data} />;
}
