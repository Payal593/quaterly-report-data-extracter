import CompaniesTable from "@/components/CompaniesTable";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Companies | FinScope",
  description: "Browse Indian listed companies available on FinScope.",
};

export default function CompaniesPage() {
  return (
    <main className="companies-page">
      <Navbar />
      <CompaniesTable />
    </main>
  );
}
