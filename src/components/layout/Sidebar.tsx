"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calculator, History, Settings } from "lucide-react";
// Removido: import { MadeWithDyad } from "@/components/made-with-dyad";

export const Sidebar = () => {
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard/overview",
      icon: LayoutDashboard,
    },
    {
      name: "Calculadora",
      path: "/dashboard/calculator",
      icon: Calculator,
    },
    {
      name: "Histórico",
      path: "/dashboard/history",
      icon: History,
    },
    {
      name: "Definições",
      path: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between border-r bg-sidebar p-4 text-sidebar-foreground">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-sidebar-primary">3D Print Calc</h2>
          <p className="text-xs text-sidebar-foreground/70">By: alexmv</p>
        </div>
        <nav className="grid items-start gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Removido: <MadeWithDyad /> */}
    </div>
  );
};