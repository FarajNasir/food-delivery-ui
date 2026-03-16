import { Suspense } from "react";
import RestaurantsContent from "@/components/RestaurantsContent";

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <RestaurantsContent />
    </Suspense>
  );
}
