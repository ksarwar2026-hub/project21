'use client'
import { useUser, UserButton} from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { assets } from "@/assets/assets"

const StoreNavbar = () => {

    const {user} = useUser()
    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 bg-white">

            {/* Logo same as Home Navbar */}
            <Link href="/" className="relative flex items-center font-semibold text-slate-700 leading-none">

                <Image
                    src={assets.KlogoFinalB}
                    alt="K-Sarwar Logo"
                    width={135}
                    height={36}
                    className="block object-contain"
                    priority
                />

                {/* Store badge */}
                <span
                    className="
                    absolute
                    -top-1
                    -right-6
                    text-[10px]
                    font-semibold
                    px-2
                    py-0.5
                    rounded-full
                    text-white
                    bg-green-500
                    leading-none
                    "
                >
                    Store
                </span>

            </Link>

            {/* Seller text */}
            <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">
                    Hi, Malik
                </p>
                <UserButton />
            </div>

        </div>
    )
}

export default StoreNavbar
