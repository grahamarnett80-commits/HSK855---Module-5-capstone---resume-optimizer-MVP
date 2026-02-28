import { getCustomerByUserId } from "@/actions/customers"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  let customer = null
  try {
    customer = await getCustomerByUserId(user.id)
  } catch (err) {
    console.error("Dashboard layout: getCustomerByUserId failed", err)
    // Continue with no customer so the page still loads (e.g. DB connection issue)
  }
  // MVP: allow all authenticated users (free or pro)
  const membership = customer?.membership ?? "free"

  const userData = {
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || "User",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatar: user.imageUrl,
    membership
  }

  return (
    <DashboardClientLayout userData={userData}>
      {children}
    </DashboardClientLayout>
  )
}
