"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const router = useRouter();

  const [verifying, setVerifying] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      if (!orderId || !sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/stripe/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          setError(data.message || "Failed to verify payment");
        }
      } catch (err) {
        setError("Network error during verification");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId, searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
        <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Verifying Payment...</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Please do not close this window</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-green-100"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase"
      >
        Payment Successful
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-gray-400 max-w-sm leading-relaxed mb-10"
      >
        Your order is now being prepared by the restaurant. You can track its real-time progress below.
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
      >
        <Link 
          href={orderId ? `/dashboard/customer/status/${orderId}` : "/dashboard/customer/orders"}
          className="flex-1 bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
        >
          Track Order <ArrowRight className="w-4 h-4" />
        </Link>
        
        <Link 
          href="/dashboard/customer/orders"
          className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 hover:text-gray-600 transition-all"
        >
          <ShoppingBag className="w-4 h-4" /> All Orders
        </Link>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-[10px] font-bold text-gray-300 uppercase tracking-widest"
      >
        Order ID: {orderId?.slice(0, 12) || "N/A"}
      </motion.p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest text-gray-300">
        Verifying Payment...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
