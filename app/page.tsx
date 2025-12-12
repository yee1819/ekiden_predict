'use client'

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Home() {
  const router = useRouter()
    useEffect(() => {
    router.replace("/predict/hakone/102")
  }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">

    </div>
  );
}
