import Image from "next/image";
import Newsletter from "@/components/Newsletter";
import { aboutWhyChooseData } from "@/assets/assets";

const AboutPage = () => {
  return (
    <div className="px-6 md:px-16 lg:px-24 py-12">
      {/* ===== ABOUT US HEADING ===== */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <p className="text-slate-800 tracking-[0.25em] text-sm md:text-base font-medium">
          ABOUT US
        </p>
        <span className="w-12 h-[2px] bg-green-500" />
      </div>

      {/* ===== ABOUT SECTION ===== */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Left Image */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <Image
            src="/about.jpg"
            alt="About K-SARWAR"
            width={900}
            height={900}
            className="w-full h-auto object-cover hover:scale-[1.02] transition duration-500"
            priority
          />
        </div>

        {/* Right Content */}
        <div className="text-slate-600">
          <p className="text-sm md:text-base leading-7">
            <span className="font-semibold text-green-600">K-SARWAR</span> is a
            trusted homeopathic research laboratory committed to developing safe,
            effective and natural medicines. Our goal is simple: help families
            live healthier with genuine homeopathic solutions.
          </p>

          <p className="mt-6 text-sm md:text-base leading-7">
            We follow a careful process of formulation, preparation and quality
            testing to ensure that every product meets our standards. With our
            online store, customers can explore and purchase medicines easily
            from the comfort of home.
          </p>

          <div className="mt-8">
            <h3 className="text-base md:text-lg font-semibold text-slate-900">
              Our Mission
            </h3>
            <p className="mt-3 text-sm md:text-base leading-7">
              Our mission is to provide trusted homeopathic remedies with
              research-driven formulation, quality assurance and seamless online
              service — from browsing and ordering to delivery and support.
            </p>
          </div>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {["Research-Based", "Quality Tested", "Genuine Products", "Fast Delivery"].map(
              (item, i) => (
                <div
                  key={i}
                  className="text-xs md:text-sm font-medium text-slate-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"
                >
                  ✅ {item}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ===== WHY CHOOSE US ===== */}
      <div className="mt-20">
        <div className="flex items-center gap-3 mb-10">
          <p className="text-slate-800 tracking-[0.25em] text-sm md:text-base font-medium">
            WHY CHOOSE US
          </p>
          <span className="w-12 h-[2px] bg-green-500" />
        </div>

        {/* ✅ Theme style boxes same as OurSpecs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 gap-y-10 mt-10">
          {aboutWhyChooseData.map((spec, index) => (
            <div
              key={index}
              className="relative h-48 px-8 flex flex-col items-center justify-center w-full text-center border rounded-xl group"
              style={{
                backgroundColor: spec.accent + "10",
                borderColor: spec.accent + "30",
              }}
            >
              <h3 className="text-slate-800 font-medium">{spec.title}</h3>
              <p className="text-sm text-slate-600 mt-3">{spec.description}</p>

              <div
                className="absolute -top-5 text-white size-10 flex items-center justify-center rounded-md group-hover:scale-105 transition"
                style={{ backgroundColor: spec.accent }}
              >
                <spec.icon size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Newsletter ===== */}
      <Newsletter />
    </div>
  );
};

export default AboutPage;
