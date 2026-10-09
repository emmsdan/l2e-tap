import { Building2, Utensils, Laptop, Bus, Bed, Wifi, HeartPulse, Wallet, type LucideIcon } from 'lucide-react';

export const STIPEND = 150000;

export const iconMap: Record<string, LucideIcon> = {
  hub: Building2,
  meals: Utensils,
  laptop: Laptop,
  transport: Bus,
  accommodation: Bed,
  data: Wifi,
  health: HeartPulse,
  allowance: Wallet,
  wallet: Wallet,
};

export function getServiceIcon(keyOrName: string): LucideIcon {
  const normalized = keyOrName.toLowerCase();
  for (const [k, icon] of Object.entries(iconMap)) {
    if (normalized.includes(k)) return icon;
  }
  return Wallet;
}

export const services = [
  { id: 'hub', name: 'Learning Hub', description: 'Desk, power and internet at your campus', price: 35000, icon: Building2 },
  { id: 'meals', name: 'Meals', description: 'Two meals a day, every training day', price: 30000, icon: Utensils },
  { id: 'laptop', name: 'Laptop', description: 'A work-ready machine on monthly terms', price: 25000, icon: Laptop },
  { id: 'transport', name: 'Transportation', description: 'Daily shuttle to and from the hub', price: 20000, icon: Bus },
  { id: 'data', name: 'Data & Internet', description: 'Monthly data bundle for remote learning', price: 15000, icon: Wifi },
  { id: 'health', name: 'Health Insurance', description: 'Clinic cover while you train', price: 10000, icon: HeartPulse },
  { id: 'allowance', name: 'Living Allowance', description: 'Cash support paid into your wallet', price: 25000, icon: Wallet },
];

export const money = (amount: number) => '₦' + amount.toLocaleString('en-NG');

export const supportTotal = (ids: string[]) =>
  services.filter((s) => ids.includes(s.id)).reduce((sum, s) => sum + s.price, 0);

export const DEFAULT_SERVICES_LIST = services;