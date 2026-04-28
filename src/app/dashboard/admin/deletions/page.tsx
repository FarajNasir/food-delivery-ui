import AdminDeletions from "@/components/dashboard/admin/AdminDeletions";

export const metadata = {
  title: "Deletion Requests | Admin Dashboard",
  description: "Manage restaurant deletion requests and grace periods.",
};

export default function AdminDeletionsPage() {
  return <AdminDeletions />;
}
