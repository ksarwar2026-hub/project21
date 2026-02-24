'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowRight, CheckCircle } from 'lucide-react'

import { assets } from '@/assets/assets'
import CategoriesMarquee from './CategoriesMarquee'


const Hero = () => {
  return (
    <div className="mx-4 sm:mx-6 mt-6">

      <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden">

        {/* ================= Desktop ================= */}
        <div className="hidden md:block relative h-[360px]">

          <Image
            src={assets.HeroBannerPC}
            alt="K-SARWAR Herbal Banner"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute inset-0 flex items-center">
            <div className="px-14 text-white max-w-lg">

              <p className="uppercase tracking-widest text-sm text-green-100">
                Holistic Healing
              </p>

              <h1 className="text-4xl font-semibold leading-tight mt-3">
                Nature’s cure <br />
                for a better life
              </h1>

              <button className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-full text-sm flex items-center gap-2 transition">
                Explore Products
                <ArrowRight size={16} />
              </button>

            </div>
          </div>

        </div>


        {/* ================= Mobile ================= */}
        <div className="relative h-48 md:hidden rounded-3xl overflow-hidden shadow-sm">

          <Image
            src={assets.HeroBannerMob}
            alt="Herbal extracts"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-center px-6">

            {/* 100% Organic Badge */}
            <div className="mb-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full w-fit">
              <CheckCircle className="w-4 h-4 text-emerald-300 fill-emerald-400/20" />
              <span className="text-white text-xs font-semibold tracking-wide uppercase">
                100% Organic
              </span>
            </div>

            <h1 className="text-white text-2xl font-bold leading-tight max-w-[180px]">
              Nature’s cure for a better life
            </h1>

            <button className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium w-fit">
              Shop Now
            </button>

          </div>
        </div>

      </div>


      <div className="mt-12">
        <CategoriesMarquee />
      </div>

    </div>
  )
}

export default Hero