import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "预测结果  ",
};

export default function RankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}