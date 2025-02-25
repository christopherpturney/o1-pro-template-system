/*
This server component provides a tailwind indicator for the app in dev mode.
*/

"use client"

import { useSearchParams } from "next/navigation"

export function TailwindIndicator() {
  const searchParams = useSearchParams()
  const showIndicator = searchParams.get("debug") === "tailwind"

  // Don't show in production or if debug parameter is not set
  if (process.env.NODE_ENV === "production" || !showIndicator) return null

  return (
    <div className="fixed bottom-12 left-3 z-50 flex size-6 items-center justify-center rounded-full bg-gray-800 p-3 font-mono text-xs text-white">
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  )
}
