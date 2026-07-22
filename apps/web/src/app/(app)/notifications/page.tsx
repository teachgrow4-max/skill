import type { Metadata } from "next";
import { NotificationsList } from "@/features/notifications/components/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      <NotificationsList />
    </div>
  );
}
