import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "队伍排名",
};

export default function RankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}