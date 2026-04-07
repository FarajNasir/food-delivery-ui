"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  ChevronLeft, 
  Package, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Navigation,
  Info,
  Loader2,
  Truck,
  Phone
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getOSRMDistance, calculateDeliveryFee } from "@/lib/delivery";

export default function CheckoutView() {
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();
  const { refreshOrders } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();

  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  
  // Delivery Fields
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [deliveryArea, setDeliveryArea] = React.useState("");
  const [distance, setDistance] = React.useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = React.useState(0);

  const isCashSite = site.key === "newcastleeats" || site.key === "downpatrickeats";

  // Group items by restaurant
  const groupedItems = React.useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const g = acc[item.restaurantId] || { name: item.restaurantName, items: [] };
      g.items.push(item);
      acc[item.restaurantId] = g;
      return acc;
    }, {} as Record<string, { name: string; items: typeof cartItems }>);
  }, [cartItems]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsCalculating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (site.coordinates) {
          const miles = await getOSRMDistance(site.coordinates, { lat: latitude, lng: longitude });
          if (miles !== null) {
            setDistance(miles);
            const fee = calculateDeliveryFee(site, { miles });
            setDeliveryFee(fee);
            toast.success(`Distance calculated: ${miles} miles`);
          } else {
            toast.error("Could not calculate road distance. Please try again.");
          }
        }
        setIsCalculating(false);
      },
      (error) => {
        toast.error("Could not get your location. Please check permissions.");
        setIsCalculating(false);
      }
    );
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const area = e.target.value;
    setDeliveryArea(area);
    const fee = calculateDeliveryFee(site, { area });
    setDeliveryFee(fee);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!address) {
      toast.error("Please enter your delivery address");
      return;
    }
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (isCashSite && deliveryFee === 0 && site.key === "newcastleeats" && !deliveryArea) {
      toast.error("Please select your delivery area");
      return;
    }
    if (site.key === "downpatrickeats" && distance === null) {
      toast.error("Please calculate your delivery distance first");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const res = await fetch("/api/orders", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: address,
          deliveryArea: deliveryArea,
          deliveryFee: deliveryFee,
          distanceMiles: distance,
          customerPhone: phone,
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Order placed successfully!");
        clearCart();
        await refreshOrders();
        const firstOrder = data.data.orders[0];
        router.push(`/dashboard/customer/status/${firstOrder.id}`);
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-12 h-12 text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Your basket is empty</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard/customer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all"
          >
            Return to Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/customer/cart"
          className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
            Complete your order
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Delivery Details Form */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-500" />
              Delivery Details
            </h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea 
                      placeholder="Enter your full street address, house number, and postcode..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gray-200 transition-all min-h-[100px] text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number (For Driver)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel"
                      placeholder="e.g. 07700 900000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gray-200 transition-all text-sm font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">The driver will call this number if they get lost.</p>
                </div>
              </div>

              {site.key === "newcastleeats" && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Select Your Area</label>
                  <select 
                    value={deliveryArea}
                    onChange={handleAreaChange}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-gray-200 transition-all text-sm font-bold appearance-none"
                  >
                    <option value="">Choose an area...</option>
                    {site.deliveryPricing?.rules.map((rule: any) => (
                      <option key={rule.name} value={rule.name}>{rule.name} - £{rule.fee.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              )}

              {site.key === "downpatrickeats" && (
                <div className="space-y-4">
                   <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Calculate distance for Delivery Fee</label>
                   <button
                    onClick={handleGetLocation}
                    disabled={isCalculating}
                    className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-blue-100 disabled:opacity-50"
                  >
                    {isCalculating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Navigation className="w-5 h-5" />
                    )}
                    {distance ? `Update Distance (${distance} miles)` : "Find My Location & Calculate"}
                  </button>
                  {distance !== null && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Calculated Fee</span>
                      <span className="text-lg font-black text-blue-900">£{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Order Items
            </h2>
            <div className="space-y-8">
              {Object.entries(groupedItems).map(([rid, group]) => (
                <div key={rid} className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl w-fit">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{group.name}</span>
                  </div>
                  <div className="grid gap-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0">
                          {item.imageUrl && <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900">{item.name}</p>
                          <p className="text-xs font-bold text-gray-400">{item.quantity} units</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">£{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6 sticky top-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">Subtotal</span>
                <span className="font-black text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">Delivery Fee</span>
                <span className={`font-black ${isCashSite ? "text-amber-500" : "text-green-500"} uppercase tracking-widest text-[10px]`}>
                  {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "TBD"}
                </span>
              </div>
              
              {isCashSite && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-widest">
                    Cash delivery fee for your driver: <br/><strong>£{deliveryFee.toFixed(2)} at the door</strong>
                  </p>
                </div>
              )}
              
              <div className="h-px bg-gray-100 my-4" />
              
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl transition-all">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">Card Payment</span>
                  {isCashSite && <span className="text-[8px] text-gray-400 font-black uppercase">(Food Only)</span>}
                </div>
                <span className="text-2xl font-black text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || isCalculating || (isCashSite && deliveryFee === 0 && site.key === "newcastleeats")}
              className="w-full py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-all" />
              {isPlacingOrder ? "Placing Order..." : "Place Order Now"}
            </button>
            
            <p className="text-[10px] font-bold text-gray-400 text-center leading-relaxed">
              Secure payments powered by Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
