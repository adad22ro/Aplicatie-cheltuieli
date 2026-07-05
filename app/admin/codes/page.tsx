import { listSignupCodes, listHouseholdsForSelect } from "@/lib/data/admin";
import { CodesPanel } from "@/components/admin/CodesPanel";

export default async function AdminCodesPage() {
  const [codes, households] = await Promise.all([
    listSignupCodes(),
    listHouseholdsForSelect(),
  ]);

  return <CodesPanel households={households} codes={codes} />;
}
