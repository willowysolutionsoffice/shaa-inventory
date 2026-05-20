import type { Icon } from "@tabler/icons-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  children?: NavItem[];
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface SidebarData {
  navMain: NavItem[];
  navSecondary: NavItem[];
  admin: NavItem[];
}

export interface MetricCard {
  title: string;
  value: string;
  description: string;
  trend: {
    type: "up" | "down";
    value: string;
  };
  footer: {
    message: string;
    description: string;
  };
}

export interface ModalProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => boolean | void;
  children: React.ReactNode;
}
