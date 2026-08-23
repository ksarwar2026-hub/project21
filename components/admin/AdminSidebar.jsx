'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, MegaphoneIcon, ShieldCheckIcon, StoreIcon, TicketPercentIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { assets } from "@/assets/assets"
import { useUser } from "@clerk/nextjs"
import { adminPath } from "@/lib/privateRoutes"

const AdminSidebar = () => {

    const { user } = useUser()

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard', href: adminPath(), match: ['/admin', adminPath()], icon: HomeIcon },
        { name: 'Stores', href: adminPath('/stores'), match: ['/admin/stores', adminPath('/stores')], icon: StoreIcon },
        { name: 'Approve Store', href: adminPath('/approve'), match: ['/admin/approve', adminPath('/approve')], icon: ShieldCheckIcon },
        { name: 'Campaigns', href: adminPath('/campaigns'), match: ['/admin/campaigns', adminPath('/campaigns')], icon: MegaphoneIcon },
        { name: 'Coupons', href: adminPath('/coupons'), match: ['/admin/coupons', adminPath('/coupons')], icon: TicketPercentIcon  },
    ]

    return user && (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                <Image className="w-14 h-14 rounded-full" src={user.imageUrl} alt="" width={80} height={80} />
                <p className="text-slate-700">{user.fullName}</p>
            </div>

            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${link.match.includes(pathname) && 'bg-slate-100 sm:text-slate-600'}`}>
                            <link.icon size={18} className="sm:ml-5" />
                            <p className="max-sm:hidden">{link.name}</p>
                            {link.match.includes(pathname) && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default AdminSidebar
