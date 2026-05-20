"use client";

import React, { useState } from "react";
import { ShieldCheck, Save, Key, UserCheck, ShieldAlert, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const [minPasswordLength, setMinPasswordLength] = useState("8");
  const [tokens, setTokens] = useState([
    { name: "POS Terminal Key 01", created: "2026-05-10", lastUsed: "2026-05-20" },
    { name: "Admin Dashboard API", created: "2026-05-01", lastUsed: "2026-05-18" },
  ]);

  const saveSettings = () => {
    toast.success("Security policies saved successfully.");
  };

  const createToken = () => {
    const newToken = {
      name: `Token ${Date.now().toString().slice(-4)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    };
    setTokens([...tokens, newToken]);
    toast.success(`Generated token: erp_pat_${Math.random().toString(36).substring(2, 10)}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-purple-600 h-8 w-8" /> Security & Policy Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage system accessibility privileges, password policies, and API tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passwords complexity policy */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Key className="h-4 w-4 text-purple-600" /> Password Strength Policies
            </CardTitle>
            <CardDescription className="text-xs">Define credential requirements for all staff and managers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Minimum Password Length</span>
              <Input value={minPasswordLength} onChange={(e) => setMinPasswordLength(e.target.value)} type="number" className="h-9 border-border" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" defaultChecked id="require_special" className="h-4 w-4 text-purple-600 rounded" />
              <label htmlFor="require_special" className="font-semibold text-foreground">Require special character and capital letters</label>
            </div>
          </CardContent>
        </Card>

        {/* API access tokens */}
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-purple-600" /> Personal API Access Tokens
              </CardTitle>
              <CardDescription className="text-xs">Access tokens for external warehouses or custom POS machines</CardDescription>
            </div>
            <Button size="sm" onClick={createToken} className="bg-purple-600 hover:bg-purple-700 h-8 text-xs text-white">
              <Plus className="h-3.5 w-3.5" /> Generate
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-2">Token Descriptor</TableHead>
                  <TableHead className="py-2">Created On</TableHead>
                  <TableHead className="py-2 text-right">Last Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((tok, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-semibold py-3 pl-4">{tok.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tok.created}</TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground pr-4">{tok.lastUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <Save className="h-4 w-4" /> Save Security Policies
        </Button>
      </div>
    </div>
  );
}
