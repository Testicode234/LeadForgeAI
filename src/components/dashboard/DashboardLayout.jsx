import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import Icon from "../AppIcon";
import Button from "../ui/Button";
import { Menu, X } from "lucide-react";

const DashboardLayout = ({ children, title, currentPath }) => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "BarChart3" },
    { path: "/campaigns", label: "Campaigns", icon: "Megaphone" },
    { path: "/contacts", label: "Contacts", icon: "Users" },
    { path: "/soon", label: "Meetings", icon: "Users" },
    { path: "/credits", label: "Credits", icon: "Coins" },
    { path: "/settings", label: "Settings", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground relative">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background md:hidden sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Icon name="Bot" size={32} color="var(--color-primary)" />
          <h1 className="text-lg font-headline-bold text-foreground">
            LeadForge AI
          </h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg border border-border"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed md:static 
        top-[64px] md:top-0  /* 👈 Sidebar starts below the header on mobile */
        left-0 
        h-[calc(100%-64px)] md:h-screen  /* 👈 Adjusts height on mobile */
        w-64 glassmorphism shadow-md border-r border-border 
        p-6 flex flex-col justify-between transform transition-transform 
        duration-300 ease-in-out z-20 bg-background
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div>
          {/* Logo & Title (hidden on mobile header) */}
          <div className="hidden md:flex items-center mb-8">
            <div className="flex items-center justify-center">
              <Icon name="Bot" size={40} color="var(--color-primary)" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-headline-bold text-foreground">
                LeadForge AI
              </h1>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full justify-start text-foreground border border-transparent hover:border-lime-500 hover:bg-lime-500 focus:border-lime-500 focus:bg-black focus:outline-none transition-all duration-200 py-5 ${
                  currentPath === item.path
                    ? "bg-black border-lime-500 text-white"
                    : ""
                }`}
                iconName={item.icon}
                iconPosition="left"
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="space-y-4 mt-6 md:mt-0">
          <span className="text-sm text-muted-foreground block">
            Welcome, {userProfile?.full_name || user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full text-error hover:text-white hover:bg-error focus:bg-error focus:text-white transition-all duration-200"
            iconName="LogOut"
            iconPosition="left"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 mt-16 md:mt-0">{children}</main>
    </div>
  );
};

export default DashboardLayout;
