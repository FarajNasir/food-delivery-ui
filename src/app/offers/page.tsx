"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";

export default function OffersPage() {
  const offers = [
    {
      id: 1,
      title: "50% OFF on Pizza Orders",
      description: "Get 50% discount on all pizza items from The Pizza Palace",
      discount: "50%",
      code: "PIZZA50",
      restaurant: "The Pizza Palace",
    },
    {
      id: 2,
      title: "Free Delivery on Orders Above $20",
      description: "Enjoy free delivery when you order more than $20",
      discount: "FREE",
      code: "DELIVERY20",
      restaurant: "All Restaurants",
    },
    {
      id: 3,
      title: "Buy 1 Get 1 Burger",
      description: "Purchase any burger and get another one free",
      discount: "BOGO",
      code: "BURGER1",
      restaurant: "Burger Express",
    },
    {
      id: 4,
      title: "20% OFF on First Order",
      description: "New customers get 20% discount on their first order",
      discount: "20%",
      code: "WELCOME20",
      restaurant: "All Restaurants",
    },
    {
      id: 5,
      title: "Sushi Combo Deal",
      description: "Get a sushi combo with miso soup and edamame at 25% off",
      discount: "25%",
      code: "SUSHIDEAL",
      restaurant: "Sushi Master",
    },
    {
      id: 6,
      title: "Monday Madness",
      description: "Every Monday - 30% off on all orders",
      discount: "30%",
      code: "MONDAY30",
      restaurant: "All Restaurants",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Special Offers</h1>
          <p className="text-gray-600">Save money with our exclusive deals and promotions</p>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{offer.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="ml-2 text-lg font-bold text-orange-600 bg-orange-50">
                    {offer.discount}
                  </Badge>
                </div>
                <CardDescription>{offer.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-sm text-gray-600">Promo Code</span>
                  <code className="font-mono font-bold text-orange-600">{offer.code}</code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid at:</span>
                  <span className="font-medium text-gray-900">{offer.restaurant}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Banner */}
        <div className="mt-12 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Gift className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Member Exclusive Offers</h2>
          </div>
          <p className="mb-4">Sign up for our newsletter to get weekly deals and exclusive offers directly to your inbox!</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-lg flex-1 text-gray-900"
            />
            <button className="px-6 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
