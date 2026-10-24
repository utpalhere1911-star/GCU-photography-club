import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — ShutterScape Photography Club · GCU",
  description:
    "Authorized access portal for ShutterScape Administrators and Executive Members at Girijananda Chowdhury University (GCU), Guwahati.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
