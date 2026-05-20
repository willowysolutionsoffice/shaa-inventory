"use client";

import React, { useState } from "react";
import { Mail, MessageSquare, Save, Settings, ShieldCheck, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CommunicationPage() {
  const [smtpServer, setSmtpServer] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  
  const [twilioSid, setTwilioSid] = useState("ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
  const [twilioToken, setTwilioToken] = useState("••••••••••••••••••••••••••••••••");

  const saveSettings = () => {
    toast.success("Communication settings saved successfully.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Mail className="text-purple-600 h-8 w-8" /> Communication Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure email servers, SMS alerts gateways, and WhatsApp channels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SMTP Configuration */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-purple-600" /> SMTP Email Server Setup
            </CardTitle>
            <CardDescription className="text-xs">Configure outgoing billing and invoice emails gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Outgoing SMTP Server</span>
              <Input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} className="h-9 border-border" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Port</span>
              <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="h-9 border-border" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Authentication User</span>
              <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="h-9 border-border" />
            </div>
          </CardContent>
        </Card>

        {/* SMS gateway */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-purple-600" /> SMS Twilio API Gateway
            </CardTitle>
            <CardDescription className="text-xs">Send automatic low-stock notifications and bills to clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Twilio Account SID</span>
              <Input value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} className="h-9 border-border" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground">Auth Token</span>
              <Input type="password" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} className="h-9 border-border" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <Save className="h-4 w-4" /> Save Channels
        </Button>
      </div>
    </div>
  );
}
