import { FeedbackWidget } from "@/components/feedback";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FeedbackWidget />
    </>
  );
}
