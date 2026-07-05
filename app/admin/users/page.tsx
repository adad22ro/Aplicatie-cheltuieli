import { listAllUsers } from "@/lib/data/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { UserRow } from "@/components/admin/UserRow";

export default async function AdminUsersPage() {
  const [admin, users] = await Promise.all([requireAdmin(), listAllUsers()]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold">Utilizatori ({users.length})</h2>
      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === admin.id} />
        ))}
      </ul>
    </div>
  );
}
