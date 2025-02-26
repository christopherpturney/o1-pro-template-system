"use server"

/**
 * @description
 * Layout for the debug pages.
 * Provides a consistent layout for all debug-related pages.
 */

export default async function DebugLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
