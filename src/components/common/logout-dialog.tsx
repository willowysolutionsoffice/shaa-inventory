"use client";

// src/components/common/logout-dialog.tsx
// No structural change — logoutAction is now a real server action that
// calls the backend to revoke the refresh token and clears cookies.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logoutAction } from "@/actions/auth";

export const LogoutDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const handleLogout = async () => {
    try {
      await logoutAction();
      // logoutAction calls redirect('/login') on the server —
      // execution never reaches here on success.
    } catch (error: any) {
      // redirect() throws a special Next.js error — don't treat it as failure
      if (error?.digest?.startsWith('NEXT_REDIRECT')) return;
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};