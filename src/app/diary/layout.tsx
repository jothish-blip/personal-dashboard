import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Life Engine Archive',
};

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}