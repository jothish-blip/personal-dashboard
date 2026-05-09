import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Diary Journal',
};

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}