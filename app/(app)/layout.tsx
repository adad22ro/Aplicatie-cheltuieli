import { BottomNav } from "@/components/BottomNav";

/** Layout comun ecranelor autentificate: adaugă bara de navigare fixă jos
 *  și spațiu în josul paginii ca ea să nu acopere conținutul. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
