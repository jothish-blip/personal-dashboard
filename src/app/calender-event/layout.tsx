import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Event Planner',
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}