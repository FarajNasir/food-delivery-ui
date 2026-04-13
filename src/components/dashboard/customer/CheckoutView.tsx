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
  Navigation, Store, ChevronDown, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getOSRMDistance, calculateDeliveryFee } from "@/lib/delivery";

export default function CheckoutView() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { refreshOrders } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();

  const userCoords  = useConfigStore((s) => s.userCoords);
  const setUserCoords = useConfigStore((s) => s.setUserCoords);
  const profile     = useAuthStore((s) => s.profile);

  const [isPlacing,    setIsPlacing]    = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const [address,      setAddress]      = React.useState("");
  const [phone,        setPhone]        = React.useState(profile?.phone ?? "");
  const [deliveryArea, setDeliveryArea] = React.useState("");
  const [distance,     setDistance]     = React.useState<number | null>(null);
  const [deliveryFee,  setDeliveryFee]  = React.useState(() => {
    // Kilkeel (standard) — fee is fixed, set it immediately
    if (site.deliveryPricing?.type === "standard") {
      return calculateDeliveryFee(site, {});
    }
    return 0;
  });

  // Sync phone if profile loads after mount
  React.useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone]);

  // Location guard — distance-slab sites require coords before checkout
  React.useEffect(() => {
    if (site.deliveryPricing?.type === "distance_slabs" && !userCoords) {
      toast.error("Please allow location access before checking out.");
      router.replace("/dashboard/customer/cart");
    }
  }, [site.deliveryPricing?.type, userCoords]);

  // Downpatrick — auto-calc if coords already available
  React.useEffect(() => {
    if (site.key !== "downpatrickeats" || !userCoords || !site.coordinates || distance !== null || isCalculating) return;
    (async () => {
      setIsCalculating(true);
      const miles = await getOSRMDistance(site.coordinates!, { lat: userCoords.lat, lng: userCoords.lng });
      if (miles !== null) {
        setDistance(miles);
        setDeliveryFee(calculateDeliveryFee(site, { miles }));
      }
      setIsCalculating(false);
    })();
  }, [site, userCoords]);

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
        if (site.coordinates) {
          const miles = await getOSRMDistance(site.coordinates, { lat: coords.latitude, lng: coords.longitude });
          if (miles !== null) {
            setDistance(miles);
            setDeliveryFee(calculateDeliveryFee(site, { miles }));
            toast.success(`${miles} miles — fee calculated`);
          } else {
            toast.error("Could not calculate road distance.");
          }
        }
        setIsCalculating(false);
      },
      () => { toast.error("Could not get location."); setIsCalculating(false); }
    );
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const area = e.target.value;
    setDeliveryArea(area);
    setDeliveryFee(calculateDeliveryFee(site, { area }));
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { toast.error("Enter your delivery address"); return; }
    if (!phone.trim())   { toast.error("Enter your phone number"); return; }
    if (site.key === "newcastleeats" && !deliveryArea) { toast.error("Select your delivery area"); return; }
    if (site.key === "downpatrickeats" && distance === null) { toast.error("Calculate your delivery distance first"); return; }

    try {
      setIsPlacing(true);
      const session = useAuthStore.getState().session;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ deliveryAddress: address, deliveryArea, deliveryFee, distanceMiles: distance, customerPhone: phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Order placed!");
        clearCart();
        await refreshOrders();
        router.push(`/dashboard/customer/status/${data.data.orders[0].id}`);
      } else {
        toast.error(data.message ?? "Failed to place order");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsPlacing(false);
    }
  };

  const isStandard    = site.deliveryPricing?.type === "standard";
  const isFixedAreas  = site.deliveryPricing?.type === "fixed_areas";
  const isDistSlabs   = site.deliveryPricing?.type === "distance_slabs";
  const grandTotal    = totalPrice + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-black text-gray-400">Your basket is empty</p>
        <Link href="/dashboard/customer" className="text-sm font-bold underline" style={{ color: accent }}>
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/customer/cart"
          className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Checkout</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Review and place your order</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">

        {/* ── LEFT FORM ── */}
        <div className="lg:col-span-3 space-y-8">

          {/* Delivery address */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Delivery Address
            </p>
            <textarea
              placeholder="House number, street, postcode…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ "--tw-ring-color": `${accent}40` } as any}
            />
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> Phone Number
            </p>
            <div className="relative">
              <input
                type="tel"
                placeholder="e.g. 07700 900000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": `${accent}40` } as any}
              />
              {profile?.phone && phone === profile.phone && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
                  From profile
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-medium">The driver will use this to contact you.</p>
          </div>

          {/* Newcastle — area picker */}
          {isFixedAreas && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Area</p>
              <div className="relative">
                <select
                  value={deliveryArea}
                  onChange={handleAreaChange}
                  className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 transition-all"
                  style={{ "--tw-ring-color": `${accent}40` } as any}
                >
                  <option value="">Select your area…</option>
                  {site.deliveryPricing?.rules.map((r: any) => (
                    <option key={r.name} value={r.name}>{r.name} — £{r.fee.toFixed(2)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Downpatrick — GPS distance calc */}
          {isDistSlabs && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Distance</p>
              <button
                onClick={handleGetLocation}
                disabled={isCalculating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all disabled:opacity-50"
                style={{ borderColor: `${accent}40`, color: accent, background: `${accent}08` }}
              >
                {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {distance !== null ? `${distance} miles — Recalculate` : "Detect My Location & Calculate"}
              </button>
              {distance !== null && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: `${accent}10` }}>
                  <span className="text-xs font-bold text-gray-500">Road distance</span>
                  <span className="text-sm font-black" style={{ color: accent }}>{distance} miles · £{deliveryFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Kilkeel standard — just show the flat fee info */}
          {isStandard && (
            <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-dashed" style={{ borderColor: `${accent}30`, background: `${accent}06` }}>
              <span className="text-xs font-bold text-gray-500">Fixed delivery fee</span>
              <span className="text-sm font-black" style={{ color: accent }}>£{deliveryFee.toFixed(2)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Order items */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Order</p>
            {Object.entries(groupedItems).map(([rid, group]) => (
              <div key={rid} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{group.name}</span>
                </div>
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} width={44} height={44} className="object-cover w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-medium">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black text-gray-700 shrink-0">£{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT SUMMARY ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-5">

            {/* Totals */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Summary</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-700">£{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Delivery</span>
                  <span className="font-bold" style={{ color: deliveryFee > 0 ? accent : "#9ca3af" }}>
                    {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-gray-800">Total</span>
                <span className="text-xl font-black" style={{ color: gradientFrom }}>
                  £{grandTotal.toFixed(2)}
                </span>
              </div>

              {isFixedAreas && (
                <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl leading-relaxed">
                  Delivery fee of £{deliveryFee.toFixed(2)} is paid in cash to the driver at the door.
                </p>
              )}
            </div>

            {/* Place order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing || isCalculating || (isFixedAreas && !deliveryArea) || (isDistSlabs && distance === null)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              {isPlacing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                : <><CreditCard className="w-4 h-4" /> Place Order</>
              }
            </button>

            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Secured by Stripe</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
