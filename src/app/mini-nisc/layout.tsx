import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'MINI Workspace',
};

export default function MiniLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}