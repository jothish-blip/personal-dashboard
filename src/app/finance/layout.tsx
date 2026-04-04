import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Finance Engine',
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}