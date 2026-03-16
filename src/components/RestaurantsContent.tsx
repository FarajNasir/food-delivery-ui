"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { restaurants } from "@/constants/restaurants";
import { Clock, MapPin, ChevronRight, Search } from "lucide-react";

export default function RestaurantsContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRestaurants = useMemo(() => {
    let filtered = location
      ? restaurants.filter(r => r.location.toLowerCase().includes(location.toLowerCase()))
      : restaurants;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [location, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {location ? `Restaurants in ${location}` : 'Find Your Favorite Restaurant'}
          </h1>
          <p className="text-gray-600">
            {location ? `Showing restaurants near ${location}` : 'Choose from our selection of amazing restaurants'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurant/${restaurant.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {restaurant.menu.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{restaurant.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">
                      {restaurant.opening} - {restaurant.closing}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-orange-600 font-medium">
                    View Menu <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}