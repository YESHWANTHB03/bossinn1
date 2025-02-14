import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Hotel,
  Grid,
  Users,
  ShoppingBag,
  LogOut,
  Receipt,
  Download,
  Menu,
  DownloadCloud,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", icon: Hotel, label: "Dashboard" },
  { path: "/rooms", icon: Grid, label: "Rooms" },
  { path: "/booked-rooms", icon: Users, label: "Booked Rooms" },
  { path: "/shop", icon: ShoppingBag, label: "Shop" },
  { path: "/checkout", icon: LogOut, label: "Checkout" },
  { path: "/payments", icon: Receipt, label: "Payments" },
];

function Navbar() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <nav className="bg-gradient-to-r from-black to-gray-500 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center">
            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <h1 className="text-white text-lg font-bold ml-3">BOSS INN</h1>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  location.pathname === path
                    ? "text-white bg-black-700 shadow-md"
                    : "text-gray-200 hover:text-white hover:bg-black-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Install App Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="hidden md:flex items-center bg-white text-black-600 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-gray-100 transition-all duration-300"
            >
              <Download className="w-5 h-5 mr-2" /> Install App
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black-700 p-4 rounded-lg shadow-md">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-black-600 rounded-md"
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            {/* Mobile Install Button */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="mt-4 flex items-center w-full bg-white text-black-600 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-gray-100"
              >
                <Download className="w-5 h-5 mr-2" /> Install App
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;