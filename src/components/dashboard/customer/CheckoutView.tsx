"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import { useAuthStore } from "@/store/useAuthStore";
import { useConfigStore } from "@/store/useConfigStore";
import { toast } from "sonner";
import {
  ChevronLeft, MapPin, Phone, CreditCard, Loader2,
  Navigation, Store, ChevronDown, ShieldCheck, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getOSRMDistance, calculateDeliveryFee } from "@/lib/delivery";
import { cn } from "@/lib/utils";

export default function CheckoutView() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { refreshOrders } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();

  const userCoords = useConfigStore((s) => s.userCoords);
  const setUserCoords = useConfigStore((s) => s.setUserCoords);
  const profile = useAuthStore((s) => s.profile);

  const [isPlacing, setIsPlacing] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState(profile?.phone ?? "");
  const [phoneEdited, setPhoneEdited] = React.useState(false);
  const [deliveryArea, setDeliveryArea] = React.useState("");
  const [distanceBreakdown, setDistanceBreakdown] = React.useState<Record<string, number>>({});
  const [deliveryFeesBreakdown, setDeliveryFeesBreakdown] = React.useState<Record<string, number>>({});
  const [deliveryFee, setDeliveryFee] = React.useState(0);

  const hasPrefilled = React.useRef(false);

  React.useEffect(() => {
    if (profile?.phone && !hasPrefilled.current && !phoneEdited) {
      setPhone(profile.phone);
      hasPrefilled.current = true;
    }
  }, [profile?.phone, phoneEdited]);

  React.useEffect(() => {
    if (site.deliveryPricing?.type === "distance_slabs" && !userCoords) {
      toast.error("Please allow location access before checking out.");
      router.replace("/dashboard/customer/cart");
    }
  }, [site.deliveryPricing?.type, userCoords]);

  // Option B: Sum fees for all restaurants
  React.useEffect(() => {
    if (site.key !== "downpatrickeats" || !userCoords || isCalculating) return;

    // Check if we already calculated everything for current userCoords
    const uniqueRestos = Array.from(new Set(cartItems.map(i => i.restaurantId)));
    const allDone = uniqueRestos.every(rid => deliveryFeesBreakdown[rid] !== undefined);
    if (allDone && Object.keys(deliveryFeesBreakdown).length === uniqueRestos.length) return;

    (async () => {
      setIsCalculating(true);
      const newDistances: Record<string, number> = {};
      const newFees: Record<string, number> = {};
      let total = 0;

      for (const restaurantId of uniqueRestos) {
        const item = cartItems.find(i => i.restaurantId === restaurantId);
        if (!item?.restaurantLat || !item?.restaurantLng) {
          // Fallback to site coordinates if restaurant coords are missing
          const miles = await getOSRMDistance(site.coordinates!, { lat: userCoords.lat, lng: userCoords.lng });
          if (miles !== null) {
            newDistances[restaurantId] = miles;
            newFees[restaurantId] = calculateDeliveryFee(site, { miles });
            total += newFees[restaurantId];
          }
          continue;
        }

        const miles = await getOSRMDistance(
          { lat: parseFloat(item.restaurantLat), lng: parseFloat(item.restaurantLng) },
          { lat: userCoords.lat, lng: userCoords.lng }
        );

        if (miles !== null) {
          newDistances[restaurantId] = miles;
          newFees[restaurantId] = calculateDeliveryFee(site, { miles });
          total += newFees[restaurantId];
        }
      }

      setDistanceBreakdown(newDistances);
      setDeliveryFeesBreakdown(newFees);
      setDeliveryFee(total);
      setIsCalculating(false);
    })();
  }, [site, userCoords, cartItems]);

  const groupedItems = React.useMemo(() =>
    cartItems.reduce((acc, item) => {
      const g = acc[item.restaurantId] ?? { name: item.restaurantName, items: [] };
      g.items.push(item);
      acc[item.restaurantId] = g;
      return acc;
    }, {} as Record<string, { name: string; items: typeof cartItems }>),
    [cartItems]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setIsCalculating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        // The effect above will trigger recalculation
      },
      () => { toast.error("Could not get location."); setIsCalculating(false); }
    );
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const area = e.target.value;
    setDeliveryArea(area);

    // For Option B in fixed_areas, we'd also sum if we had multiple areas.
    // For now, assume fixed fee applies per restaurant in the cart.
    const perRestoFee = calculateDeliveryFee(site, { area });
    const uniqueRestos = Array.from(new Set(cartItems.map(i => i.restaurantId)));
    const total = perRestoFee * uniqueRestos.length;

    const breakdown: Record<string, number> = {};
    uniqueRestos.forEach(rid => breakdown[rid] = perRestoFee);

    setDeliveryFeesBreakdown(breakdown);
    setDeliveryFee(total);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { toast.error("Enter your delivery address"); return; }
    if (!phone.trim()) { toast.error("Enter your phone number"); return; }
    if (site.key === "newcastleeats" && !deliveryArea) { toast.error("Select your delivery area"); return; }
    if (site.key === "downpatrickeats" && deliveryFee === 0 && !isStandard) { toast.error("Calculate your delivery distance first"); return; }

    try {
      setIsPlacing(true);
      const session = useAuthStore.getState().session;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({
          deliveryAddress: address,
          deliveryArea,
          deliveryFee,
          deliveryFeesBreakdown, // Sum-up breakdown
          distanceMiles: 0, // No longer a single distance
          customerPhone: phone
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Order placed!");
        clearCart();
        await refreshOrders();
        // Redirect to the first sub-order or a custom session status page
        router.push(`/dashboard/customer/orders`);
      } else {
        toast.error(data.message ?? "Failed to place order");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsPlacing(false);
    }
  };

  const isStandard = site.deliveryPricing?.type === "standard";
  const isFixedAreas = site.deliveryPricing?.type === "fixed_areas";
  const isDistSlabs = site.deliveryPricing?.type === "distance_slabs";
  const paysDeliveryAtDoor = site.key === "newcastleeats" || site.key === "downpatrickeats";
  const grandTotal = totalPrice + (paysDeliveryAtDoor ? 0 : deliveryFee);

  const inputClass = "w-full px-3.5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:border-gray-300 focus:bg-white transition-all";

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-base font-bold text-gray-500">Your basket is empty</p>
        <Link href="/dashboard/customer" className="text-sm font-bold underline" style={{ color: accent }}>
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/customer/cart"
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-[11px] text-gray-400">Review and place your order</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── LEFT FORM ── */}
        <div className="lg:col-span-3 space-y-12">

          {/* Delivery Details Section */}
          <div className="border-b border-gray-100 pb-10 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Details</p>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: accent }} />
                Delivery Address
              </label>
              <textarea
                placeholder="House number, street, postcode…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className={cn(inputClass, "resize-none")}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" style={{ color: accent }} />
                  Contact Number
                </span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 07700 900000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneEdited(true);
                  }}
                  className={inputClass}
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                The driver will use this number if they need to contact you. You can change it if you're ordering for someone else.
              </p>
            </div>

            {/* Fixed Areas */}
            {isFixedAreas && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Delivery Area</label>
                <div className="relative">
                  <select
                    value={deliveryArea}
                    onChange={handleAreaChange}
                    className={cn(inputClass, "appearance-none pr-10")}
                  >
                    <option value="">Select your area…</option>
                    {site.deliveryPricing?.rules.map((r: any, idx: number) => (
                      <option key={`${r.name}-${idx}`} value={r.name}>{r.name} — £{r.fee.toFixed(2)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Distance Slabs */}
            {isDistSlabs && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600">Delivery Distance</label>
                <button
                  onClick={handleGetLocation}
                  disabled={isCalculating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50"
                  style={{ borderColor: `${accent}40`, color: accent, background: `${accent}08` }}
                >
                  {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {Object.keys(distanceBreakdown).length > 0 ? "Recalculate Distances" : "Detect My Location & Calculate"}
                </button>
                {Object.entries(distanceBreakdown).map(([rid, dist]) => (
                  <div key={rid} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: `${accent}10` }}>
                    <span className="text-[10px] text-gray-500 font-bold uppercase truncate max-w-[120px]">
                      {groupedItems[rid]?.name}
                    </span>
                    <span className="text-sm font-black" style={{ color: accent }}>
                      {dist} mi · £{deliveryFeesBreakdown[rid]?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Standard flat fee */}
            {isStandard && deliveryFee > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed" style={{ borderColor: `${accent}30`, background: `${accent}06` }}>
                <span className="text-xs text-gray-500">Fixed delivery fee</span>
                <span className="text-sm font-black" style={{ color: accent }}>£{deliveryFee.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Order Items Section */}
          <div className="pt-2 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Summary</p>
            {Object.entries(groupedItems).map(([rid, group]) => (
              <div key={rid} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500">{group.name}</span>
                </div>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 bg-gray-50 rounded flex items-center justify-center text-[10px] font-sans font-bold text-gray-400">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="text-sm font-sans font-bold text-gray-800">{item.name}</p>
                          <p className="text-[10px] font-sans text-gray-400 font-medium">Standard Preparation</p>
                        </div>
                      </div>
                      <span className="text-sm font-sans font-bold text-gray-900">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT SUMMARY ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">

            {/* Price Breakdown */}
            <div className="bg-gray-50/50 rounded-2xl p-6 space-y-3 border border-gray-100/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bill Details</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                  <span>Item Total</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-gray-400">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee > 0
                      ? paysDeliveryAtDoor
                        ? `£${deliveryFee.toFixed(2)} at doorstep`
                        : `£${deliveryFee.toFixed(2)}`
                      : "FREE"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-200/50 my-2" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-sans font-bold text-gray-900">Grand Total</span>
                <span className="text-2xl font-heading font-black text-gray-900 tracking-tight">
                  £{grandTotal.toFixed(2)}
                </span>
              </div>

              {(isFixedAreas || isDistSlabs) && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50/50 border border-amber-100/50 mt-4">
                  <span className="text-amber-500 text-xs">ⓘ</span>
                  <p className="text-[10px] text-amber-800/80 font-medium leading-relaxed">
                    The delivery fee of £{deliveryFee.toFixed(2)} is paid directly in cash to the driver upon arrival.
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing || isCalculating || (isFixedAreas && !deliveryArea) || (isDistSlabs && Object.keys(distanceBreakdown).length === 0)}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm uppercase tracking-wide shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              {isPlacing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                : <><CreditCard className="w-4 h-4" /> Place Order</>
              }
            </button>

            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
              <p className="text-[10px] text-gray-400 font-medium">Secured by Stripe</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
