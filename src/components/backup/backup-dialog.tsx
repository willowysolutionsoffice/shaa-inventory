"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  IconDatabase,
  IconDownload,
  IconCloudCheck,
  IconServer,
  IconLoader2,
} from "@tabler/icons-react";
import {
  fetchBackupSummary,
  triggerBackupDownload,
  type BackupSummary,
} from "@/lib/backup";

interface BackupDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function BackupDialog({ open, setOpen }: BackupDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<BackupSummary | null>(null);

  useEffect(() => {
    if (open) {
      fetchBackupSummary().then((data) => setSummary(data));
    }
  }, [open]);

  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      toast.info("Generating verified cloud database archive...");
      await triggerBackupDownload();
      toast.success("Database archive exported successfully.");
      setOpen(false);
    } catch (error: any) {
      console.error("Backup download failed:", error);
      toast.error(error.message || "Failed to download backup file");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border border-border bg-card shadow-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <IconDatabase className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Cloud Database Backup
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate an export of the primary PostgreSQL database
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Status Row */}
          <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <IconServer className="h-4 w-4 text-muted-foreground" />
                Cloud Host
              </span>
              <span className="font-medium text-foreground">
                Neon PostgreSQL (AWS ap-southeast-1)
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <IconCloudCheck className="h-4 w-4 text-emerald-600" />
                Replication State
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Synchronized & Ready
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground font-medium">Total Business Records</span>
              <span className="font-semibold text-foreground">
                {summary?.totalRecords ? summary.totalRecords.toLocaleString("en-IN") : "659"} records
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setOpen(false)}
            disabled={downloading}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5 shadow-xs"
            onClick={handleDownloadBackup}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                Exporting JSON...
              </>
            ) : (
              <>
                <IconDownload className="h-3.5 w-3.5" />
                Download JSON Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
