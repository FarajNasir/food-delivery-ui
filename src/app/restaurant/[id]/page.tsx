"use client";

import { useState } from "react";
import Link from "next/link";
import { restaurants } from "@/constants/restaurants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Search, ShoppingCart, ArrowLeft } from "lucide-react";
import React from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantPage({ params }: PageProps) {
  const { id } = React.use(params);
  const restaurant = restaurants.find((r) => r.id === id);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<string[]>([]);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <Link href="/restaurants">
            <Button>Back to Restaurants</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredMenu = restaurant.menu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (itemId: string) => {
    setCartItems([...cartItems, itemId]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/restaurants" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Restaurants
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Menu Section */}
          <div className="md:col-span-2">
            {/* Restaurant Info */}
            <div className="bg-white rounded-lg p-6 mb-8 border">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{restaurant.name}</h1>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{restaurant.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    {restaurant.opening} - {restaurant.closing}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Menu Items</label>
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search by name, e.g. 'pizza', 'burger', 'sushi'..."
                  className="pl-12 py-2.5 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2">
                  Found {filteredMenu.length} item{filteredMenu.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
              {filteredMenu.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items found</p>
              ) : (
                filteredMenu.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="secondary" className="text-lg font-bold">
                              ${item.price.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(item.id)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Cart Section */}
          <div className="md:col-span-1">
            {/* Your Order Card */}
            <Card className="sticky top-24 border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2 mb-4">
                      {cartItems.map((itemId, index) => {
                        const item = restaurant.menu.find((m) => m.id === itemId);
                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item?.name}</span>
                            <span className="font-medium">${item?.price.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-orange-600">
                          $
                          {cartItems
                            .reduce((sum, itemId) => {
                              const item = restaurant.menu.find((m) => m.id === itemId);
                              return sum + (item?.price || 0);
                            }, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Restaurant Button */}
            <Link href="/restaurants" className="block mt-4">
              <Button variant="outline" className="w-full">
                Change Restaurant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

