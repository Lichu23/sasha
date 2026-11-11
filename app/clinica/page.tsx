import type { Metadata, Viewport } from "next";
import { WhatsAppChat } from "@/components/clinica/whatsapp-chat";

export const metadata: Metadata = { title: "Chat de WhatsApp" };

// The browser bar takes WhatsApp's green on this page.
export const viewport: Viewport = { themeColor: "#008069" };

export default function ChatPage() {
  return <WhatsAppChat />;
}
