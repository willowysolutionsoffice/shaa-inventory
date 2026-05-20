"use client";

import React, { useState } from "react";
import { HelpCircle, Save, LifeBuoy, FileText, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.warning("Please fill out both the ticket subject and description details.");
      return;
    }
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" /> Support Ticket Generated!
        </span>
        <span className="text-xs">Voucher: Ticket #{Math.floor(Math.random() * 9000 + 1000)}</span>
        <span className="text-xs">Subject: {subject}</span>
      </div>
    );
    setSubject("");
    setMessage("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <LifeBuoy className="text-purple-600 h-8 w-8 animate-bounce-slow" /> Support Desk & Knowledge
        </h1>
        <p className="text-muted-foreground text-sm">
          Submit technical tickets, browse documentation guides, and verify live ERP uptime status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support ticket form */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Send className="h-4 w-4 text-purple-600" /> Submit Technical Help Request
            </CardTitle>
            <CardDescription className="text-xs">Our ERP support squad replies to B2B queries under 4 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Subject / Core Issue</span>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. POS terminal barcode delay, database latency..." className="h-9 border-border" />
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Detailed Description</span>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Provide contextual logs or reproduction routes..." className="min-h-[120px] border-border text-xs" />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 shadow-md shadow-purple-600/20">
                Post Support Voucher
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQs collapsible */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-purple-600" /> Statutory System FAQs
            </CardTitle>
            <CardDescription className="text-xs">Quick answers to system configuration and offline updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5 border-b border-border pb-2.5">
              <h4 className="font-bold text-foreground">How does the fully offline mock-db mode work?</h4>
              <p className="text-muted-foreground text-[11px]">
                The ERP is completely decoupled from MongoDB and Prisma database engines. All products, sales, purchases, and ledger entries populate in-memory structures in `mock-db.ts` to allow 100% stable execution without live servers.
              </p>
            </div>
            <div className="space-y-1.5 border-b border-border pb-2.5">
              <h4 className="font-bold text-foreground">Can I print invoices directly from the browser?</h4>
              <p className="text-muted-foreground text-[11px]">
                Yes, clicking the &quot;Print Ledger&quot; or &quot;Print Invoice&quot; button opens the browser print drawer with highly optimized invoice stylesheet templates ready for commercial paper rolls.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
