"use server"

/**
 * @description
 * This server component provides a basic settings page for the dashboard.
 * Currently a placeholder without actual functionality.
 *
 * Key features:
 * - Display of settings categories
 * - Basic UI structure for future implementation
 *
 * @dependencies
 * - Next.js server components
 *
 * @notes
 * - This is a placeholder and will be expanded with actual functionality in the future
 */

import { Suspense } from "react"
import { Settings, User, Bell, Shield, CreditCard } from "lucide-react"
import { Card } from "@/components/ui/card"

export default async function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingsCard
          icon={<User className="size-5" />}
          title="Profile"
          description="Manage your personal information"
        />

        <SettingsCard
          icon={<Bell className="size-5" />}
          title="Notifications"
          description="Configure your notification preferences"
        />

        <SettingsCard
          icon={<Shield className="size-5" />}
          title="Privacy & Security"
          description="Manage your security settings"
        />

        <SettingsCard
          icon={<CreditCard className="size-5" />}
          title="Billing"
          description="Manage your subscription plan"
        />
      </div>
    </div>
  )
}

/**
 * A card component to display a settings category
 */
function SettingsCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="hover:shadow-card cursor-pointer p-6 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary rounded-lg p-2">{icon}</div>
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
      </div>
    </Card>
  )
}
