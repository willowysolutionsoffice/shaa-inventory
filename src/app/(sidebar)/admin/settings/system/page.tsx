"use client";

import React, { useState } from "react";
import { Settings, Save, Database, Globe, Layers, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const [companyName, setCompanyName] = useState("Willowy ERP SaaS Corp");
  const [timezone, setTimezone] = useState("GMT +5:30 (India Standard Time)");
  const [currency, setCurrency] = useState("USD");

  const saveSettings = () => {
    toast.success("Global system variables successfully updated.");
  };

  const resetSandboxDatabase = () => {
    toast.info("Database sandbox successfully refreshed to initial demo records.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="text-purple-600 h-8 w-8" /> System Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Adjust corporate configurations, localization variables, and background batch schedules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core details */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-purple-600" /> General Corporate Branding
            </CardTitle>
            <CardDescription className="text-xs">Adjust header brand tags and timezone alignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Corporate Brand Tag Name</span>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-9 border-border" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Standard timezone</span>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9 border-border" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Global Base Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 shadow-sm transition-colors text-xs focus-visible:outline-none"
              >
                <option value="USD">USD ($) United States Dollars</option>
                <option value="EUR">EUR (€) Euros</option>
                <option value="INR">INR (₹) Indian Rupees</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Database actions */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Database className="h-4 w-4 text-purple-600" /> Mock Sandbox Actions
            </CardTitle>
            <CardDescription className="text-xs">Manage stateful in-memory cache and collections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Resetting the sandbox database will restore all customers, purchase and sales invoices to the base mock dataset, cleaning any local changes.
              </span>
            </div>
            <Button variant="destructive" className="w-full text-xs h-9 bg-red-600 hover:bg-red-700" onClick={resetSandboxDatabase}>
              Reset Database Sandbox
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <Save className="h-4 w-4" /> Save System Configs
        </Button>
      </div>
    </div>
  );
}
