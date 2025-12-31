import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PB排名",
};

export default function RankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}