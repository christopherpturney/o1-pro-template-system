"use server"

/**
 * @description
 * Layout for the debug trace detail page.
 * Provides a consistent structure for the trace detail view.
 */

export default async function TraceDetailLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
