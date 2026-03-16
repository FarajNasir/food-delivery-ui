"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkLogin = () => {
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    setIsLoggedIn(!!user);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    checkLogin();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkLogin();
    window.addEventListener("storage", checkLogin);
    // Check login state when visibility changes (tab comes into focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLogin();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("storage", checkLogin);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkLogin();
  }, [pathname]);

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          FoodHub
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            Home
          </Link>
          {!isLoggedIn && (
            <Link href="/restaurants" className="text-gray-600 hover:text-gray-900 transition">
              Order
            </Link>
          )}
          <Link href="/offers" className="text-gray-600 hover:text-gray-900 transition">
            Offers
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/account">
              <Button variant="outline" className="cursor-pointer">Account</Button>
            </Link>
          ) : (
            <Link href="/account/login">
              <Button className="cursor-pointer">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}