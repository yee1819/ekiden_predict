'use client'

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { redirect } from 'next/navigation'
export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/predict/hakone/102/finalPredict")
  }, [])
  redirect('/predict/hakone/102/finalPredict')
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">

    </div>
  );
}
