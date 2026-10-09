import { Building2, Utensils, Laptop, Bus, Bed, Wifi, HeartPulse, Wallet } from 'lucide-react';

export const STIPEND = 150000;

export const services = [
  { id: 'hub', name: 'Learning Hub', description: 'Desk, power and internet at your campus', price: 35000, icon: Building2 },
  { id: 'meals', name: 'Meals', description: 'Two meals a day, every training day', price: 30000, icon: Utensils },
  { id: 'laptop', name: 'Laptop', description: 'A work-ready machine on monthly terms', price: 25000, icon: Laptop },
  { id: 'transport', name: 'Transportation', description: 'Daily shuttle to and from the hub', price: 20000, icon: Bus },
  { id: 'accommodation', name: 'Accommodation', description: 'A shared room close to campus', price: 45000, icon: Bed },
  { id: 'data', name: 'Data & Internet', description: 'Monthly data bundle for remote learning', price: 15000, icon: Wifi },
  { id: 'health', name: 'Health Insurance', description: 'Clinic cover while you train', price: 10000, icon: HeartPulse },
  { id: 'allowance', name: 'Living Allowance', description: 'Cash support paid into your wallet', price: 25000, icon: Wallet },
];

export const money = (amount: number) => '₦' + amount.toLocaleString('en-NG');

export const supportTotal = (ids: string[]) =>
  services.filter((s) => ids.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
