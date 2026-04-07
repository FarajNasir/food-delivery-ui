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
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CheckoutView() {
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();
  const { refreshOrders } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  // Group items by restaurant for a cleaner display
  const groupedItems = React.useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const g = acc[item.restaurantId] || { name: item.restaurantName, items: [] };
      g.items.push(item);
      acc[item.restaurantId] = g;
      return acc;
    }, {} as Record<string, { name: string; items: typeof cartItems }>);
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    try {
      setIsPlacingOrder(true);
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Order placed successfully!");
        clearCart();
        await refreshOrders();
        // Redirect to the first order ID created (or the general status list)
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
          <Link 
            href="/dashboard/customer/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-black/5"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Track My Orders
            <Package className="w-5 h-5" />
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
            Review your order details
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Order Items Summary */}
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {group.name}
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
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

          {/* Delivery & Security */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
              <MapPin className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="text-sm font-black text-gray-900">Delivery Address</h3>
                <p className="text-xs font-bold text-gray-400 leading-relaxed mt-1">
                  123 High Street<br />
                  BT34 4XX, Newcastle
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <div>
                <h3 className="text-sm font-black text-gray-900">Secure Checkout</h3>
                <p className="text-xs font-bold text-gray-400 leading-relaxed mt-1">
                  Your data is protected by industry-standard encryption.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6 sticky top-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Execution Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">Total Items</span>
                <span className="font-black text-gray-900">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">Subtotal</span>
                <span className="font-black text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">Delivery Fee</span>
                <span className="font-black text-green-500 uppercase tracking-widest text-[10px]">Free</span>
              </div>
              
              <div className="h-px bg-gray-100 my-4" />
              
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Final Total</span>
                <span className="text-2xl font-black text-gray-900">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-all" />
              {isPlacingOrder ? "Placing Order..." : "Place Order Now"}
            </button>
            
            <p className="text-[10px] font-bold text-gray-400 text-center leading-relaxed">
              By clicking "Place Order Now", you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
