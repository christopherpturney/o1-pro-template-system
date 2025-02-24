/*
This server layout provides a shared header and basic structure for (marketing) routes.
*/

"use server"

export default async function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  )
}
