import CategoryDishes from "@/components/dashboard/customer/CategoryDishes";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await the params object (Next.js 15 requirement)
  const resolvedParams = await params;
  // Decode URL parameter (e.g. %20 -> space)
  const category = decodeURIComponent(resolvedParams.category);
  
  return <CategoryDishes category={category} />;
}

