import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Focus Engine',
};

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}