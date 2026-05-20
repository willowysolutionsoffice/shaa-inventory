import clsx from "clsx";
import Link from "next/link";

// components/sidebar/sidebar-menu.tsx
export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarMenuButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between w-full px-2 py-2 text-sm rounded-md hover:bg-muted">
      {children}
    </div>
  );
}

export function SidebarMenuSub({ children }: { children: React.ReactNode }) {
  return <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">{children}</div>;
}

export function SidebarMenuSubItem({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "block text-sm text-muted-foreground hover:text-foreground transition-colors",
        active && "text-foreground font-medium"
      )}
    >
      {children}
    </Link>
  );
}
