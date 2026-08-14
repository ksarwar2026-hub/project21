'use client'

import {
    ArrowRight,
    BadgeCheck,
    ChevronDown,
    Droplets,
    Leaf,
    ListChecks,
    ShieldCheck,
    Sparkles,
    StarIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { assets } from "@/assets/assets"

const descriptionHeroImage = "/assets/product-description-hero.png"

const ingredientImageFallbacks = [
    assets.ingredient1Desktop,
    assets.ingredient2Desktop,
    assets.ingredient3Desktop,
    assets.concernDryHair,
]

const ingredientIconFallbacks = [Leaf, Droplets, Leaf, Sparkles]

const defaultKeyIngredients = [
    {
        name: "Rosemary",
        imageUrl: "",
        caption:
            "A botanical ingredient used in scalp care routines to support a fresh, cared-for scalp and stronger-looking hair.",
    },
    {
        name: "Rice Water",
        imageUrl: "",
        caption:
            "Known for amino acid and nutrient-rich care, rice water helps support smoother-feeling, stronger-looking hair.",
    },
    {
        name: "Aloe Vera",
        imageUrl: "",
        caption:
            "Helps provide lightweight moisture and a soothing feel, making the spray comfortable for daily leave-in use.",
    },
    {
        name: "Amla & Bhringraj",
        imageUrl: "",
        caption:
            "Traditional botanicals used in hair-care rituals to nourish the scalp and support healthy-looking hair care.",
    },
]

const defaultBenefitPoints = [
    "Supports everyday scalp care without a heavy or sticky feel.",
    "Helps keep hair smoother-feeling and easier to manage.",
    "Designed as a lightweight leave-in step for daily hair-care routines.",
    "Combines botanical care cues with clear ingredient communication.",
]

const defaultHowToUseSteps = [
    {
        step: "01",
        title: "Apply",
        text: "Spray evenly on the scalp or hair roots as part of your daily hair-care routine.",
        icon: Droplets,
    },
    {
        step: "02",
        title: "Massage",
        text: "Gently massage with fingertips so the formula spreads across the scalp.",
        icon: Sparkles,
    },
    {
        step: "03",
        title: "Leave",
        text: "Leave it in. Do not rinse unless your product label or routine says otherwise.",
        icon: Leaf,
    },
]

const defaultTransparencyIngredients = [
    "Rosemary Extract",
    "Rice Water",
    "Aloe Vera",
    "Amla Extract",
    "Bhringraj Extract",
    "Aqua",
    "Preservative system as per product label",
]

const defaultSafetyItems = [
    "For external use only.",
    "Avoid direct contact with eyes.",
    "Do a patch test before use.",
    "Store in a cool, dry place away from direct sunlight.",
    "Keep out of reach of children.",
]

const getProductType = (category = "") => {
    const normalizedCategory = category.toLowerCase()

    if (normalizedCategory.includes("serum")) return "Hair Serum"
    if (normalizedCategory.includes("shampoo")) return "Hair Shampoo"
    if (normalizedCategory.includes("oil")) return "Hair Oil"
    if (normalizedCategory.includes("spray")) return "Hair Care Spray"
    if (normalizedCategory.includes("hair")) return "Hair Care Spray"

    return category || "Hair Care Product"
}

const getVolume = (productName = "") => {
    const match = productName.match(/(\d+(?:\.\d+)?)\s?(ml|g|gm|kg|l|oz)/i)
    return match ? `${match[1]} ${match[2].toLowerCase()}` : "100 ml"
}

const hasText = (value) => typeof value === "string" && value.trim().length > 0

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')
    const [openFaq, setOpenFaq] = useState(null)
    const [showFullIngredients, setShowFullIngredients] = useState(false)
    const content = product.content || {}

    const productType = useMemo(
        () => content.productType || getProductType(product.category),
        [content.productType, product.category]
    )
    const volume = useMemo(
        () => content.volume || getVolume(product.name),
        [content.volume, product.name]
    )
    const formula = content.formula || "Lightweight Leave-In"
    const hairType = content.hairType || "All Hair Types"
    const introduction = content.introduction || product.description
    const formulaTitle = content.formulaTitle || "What makes the formula different"
    const formulaDescription =
        content.formulaDescription ||
        "The formula is presented as a lightweight leave-in product for daily hair-care use. The focus is on botanical routine support, scalp care, smoother-feeling hair, and transparent ingredient communication, without exaggerated or undocumented claims."
    const renderedIngredients =
        content.keyIngredients?.length > 0
            ? content.keyIngredients.map((ingredient, index) => ({
                name: ingredient.name || defaultKeyIngredients[index]?.name || "Ingredient",
                imageUrl: ingredient.imageUrl || "",
                caption: ingredient.benefit || defaultKeyIngredients[index]?.caption || "",
            }))
            : defaultKeyIngredients
    const benefitPoints = content.benefits?.length > 0 ? content.benefits : defaultBenefitPoints
    const howToUseSteps =
        content.usageSteps?.length > 0
            ? content.usageSteps.map((step, index) => ({
                step: step.step || String(index + 1).padStart(2, "0"),
                title: step.title || defaultHowToUseSteps[index]?.title || "Use",
                text: step.text || defaultHowToUseSteps[index]?.text || "",
                icon: defaultHowToUseSteps[index]?.icon || Leaf,
            }))
            : defaultHowToUseSteps
    const transparencyIngredients =
        content.fullIngredients?.length > 0 ? content.fullIngredients : defaultTransparencyIngredients
    const safetyItems = content.safety?.length > 0 ? content.safety : defaultSafetyItems
    const whoItsFor =
        content.whoItsFor ||
        "Suitable for customers looking for an all-hair-type daily scalp care product, rosemary and rice water hair routine support, lightweight leave-in hair care, and non-sticky everyday use."

    const ingredientBannerImage =
        content.ingredientBanner?.url ||
        content.ingredientBannerUrl ||
        content.keyIngredientBanner ||
        descriptionHeroImage

    const productDetails = [
        ["Brand", "K-SARWAR"],
        ["Product Type", productType],
        ["Formula", formula],
        ["Hair Type", hairType],
        ["Volume", volume],
    ].filter(([, value]) => hasText(value))

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    return (
        <section className="my-16 text-[#1B1B1C]">

            <div className="mb-8 flex border-b border-[#E5E2E1] text-sm">
                {['Description', 'Reviews', 'FAQs'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-4 py-3 font-semibold transition ${
                            tab === selectedTab
                                ? 'border-b-2 border-[#344E41] text-[#1E372B]'
                                : 'text-[#8A918A] hover:text-[#344E41]'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {selectedTab === "Description" && (
                <article className="space-y-12" itemScope itemType="https://schema.org/Product">
                    <meta itemProp="name" content={product.name} />
                    <meta itemProp="brand" content="K-SARWAR" />
                    <meta itemProp="category" content={product.category} />

                    <section className="grid gap-8 rounded-[28px] border border-[#E5E2E1] bg-white p-6 shadow-[0_18px_54px_rgba(30,55,43,0.05)] lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                Product Introduction
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-[#1E372B] sm:text-4xl">
                                {product.name}
                            </h2>
                        </div>
                        <div className="space-y-5 text-sm leading-7 text-[#59645D]">
                            <p itemProp="description">
                                {introduction}
                            </p>
                            <p>
                                K-SARWAR {productType} is designed for a simple daily hair-care routine where scalp comfort,
                                lightweight application, and clearer product information matter. It fits customers searching
                                for rosemary hair spray, rice water hair care, scalp care spray, leave-in hair treatment,
                                and everyday hair-strength routine support.
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-[24px] border border-[#E5E2E1] bg-[#FCF9F8] p-6 lg:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                Formula Concept
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-[#1E372B]">
                                {formulaTitle}
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[#59645D]">
                                {formulaDescription}
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-[24px] border border-[#E5E2E1] bg-[#F8F4EA] p-6">
                            {["Lightweight feel", "Leave-in routine", "Botanical care cues"].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#1E372B]">
                                    <BadgeCheck className="h-5 w-5 text-[#344E41]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="key-ingredients-heading">
                        <div className="relative min-h-[360px] overflow-hidden rounded-[30px] border border-[#E5E2E1] bg-[#F8F4EA] shadow-[0_20px_60px_rgba(30,55,43,0.07)] sm:min-h-[430px]">
                            <Image
                                src={ingredientBannerImage}
                                alt={`${product.name} key ingredient product lab banner`}
                                fill
                                className="object-cover object-center"
                                sizes="(max-width: 768px) 100vw, 1280px"
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-[#FCF9F8]/95 via-[#FCF9F8]/68 to-transparent" />
                            <div className="relative max-w-xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C826A]">
                                    Key Ingredients
                                </p>
                                <h2 id="key-ingredients-heading" className="mt-4 font-serif text-[38px] font-medium leading-[1.05] text-[#1E372B] sm:text-5xl">
                                    The botanicals behind our formula.
                                </h2>
                                <p className="mt-5 text-base leading-8 text-[#3F4B43]">
                                    Thoughtfully selected ingredients for a daily scalp and hair-care routine, explained in
                                    plain language so customers and search engines can understand what is inside.
                                </p>
                                <div className="mt-7 inline-flex items-center gap-3 rounded-full bg-white/82 px-4 py-2 text-sm font-semibold text-[#344E41] shadow-sm">
                                    <Leaf className="h-5 w-5" />
                                    Clean. Effective. Trusted.
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {renderedIngredients.map((ingredient, index) => {
                                const IngredientIcon = ingredientIconFallbacks[index % ingredientIconFallbacks.length]
                                const ingredientImage = ingredient.imageUrl || ingredientImageFallbacks[index % ingredientImageFallbacks.length]

                                return (
                                <article
                                    key={ingredient.name}
                                    className="overflow-hidden rounded-[24px] border border-[#E5E2E1] bg-white shadow-[0_12px_34px_rgba(30,55,43,0.04)]"
                                >
                                    <div className="relative aspect-[1.35] bg-[#F8F4EA]">
                                        <Image
                                            src={ingredientImage}
                                            alt={`${ingredient.name} ingredient used in ${product.name}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF4DE] text-[#344E41]">
                                            <IngredientIcon size={20} />
                                        </div>
                                        <h3 className="mt-4 text-base font-semibold uppercase tracking-[0.12em] text-[#1E372B]">
                                            {ingredient.name}
                                        </h3>
                                        <div className="mt-3 h-px w-12 bg-[#C8CDBD]" />
                                        <p className="mt-4 text-sm leading-7 text-[#59645D]">
                                            {ingredient.caption}
                                        </p>
                                    </div>
                                </article>
                                )
                            })}
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-[24px] border border-[#E5E2E1] bg-[#FCF9F8] p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                How It Works
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                                Benefits for everyday hair care
                            </h2>
                        </div>
                        <div className="grid gap-3">
                            {benefitPoints.map((benefit) => (
                                <div key={benefit} className="flex gap-3 rounded-2xl border border-[#E5E2E1] bg-white p-4 text-sm leading-7 text-[#59645D]">
                                    <ListChecks className="mt-1 h-5 w-5 shrink-0 text-[#344E41]" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-[#E5E2E1] bg-white p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                            How To Use
                        </p>
                        <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                            Apply. Massage. Leave.
                        </h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {howToUseSteps.map((item) => (
                                <div key={item.step} className="rounded-2xl border border-[#E5E2E1] bg-[#FCF9F8] p-5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-serif text-4xl text-[#A9B08D]">{item.step}</span>
                                        <item.icon className="h-6 w-6 text-[#344E41]" />
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold text-[#1E372B]">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-[#59645D]">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[24px] border border-[#E5E2E1] bg-[#F8F4EA] p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                Who It's For
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                                Routine suitability
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[#59645D]">
                                {whoItsFor}
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-[#E5E2E1] bg-white p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                Product Details
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                                Important information
                            </h2>
                            <dl className="mt-5 divide-y divide-[#E5E2E1]">
                                {productDetails.map(([label, value]) => (
                                    <div key={label} className="grid grid-cols-[0.8fr_1fr] gap-4 py-4 text-sm">
                                        <dt className="font-semibold text-[#59645D]">{label}</dt>
                                        <dd className="font-semibold text-[#1E372B]">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-[28px] border border-[#E5E2E1] bg-white">
                        <div className="grid gap-8 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
                            <div className="lg:border-r lg:border-[#E5E2E1] lg:pr-8">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                    Transparency
                                </p>
                                <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                                    Complete ingredient list
                                </h2>
                                <p className="mt-4 max-w-md text-sm leading-7 text-[#59645D]">
                                    We believe in complete transparency. Key ingredients are highlighted above, and the full
                                    ingredient information can be shown here for customers before purchase.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowFullIngredients((prev) => !prev)}
                                    className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-full border border-[#91A28D] px-6 text-sm font-semibold text-[#1E372B] transition hover:bg-[#EEF4DE]"
                                >
                                    {showFullIngredients ? "Hide Full Ingredient List" : "View Full Ingredient List"}
                                    <ArrowRight size={17} />
                                </button>
                                {showFullIngredients && (
                                    <ul className="mt-5 grid gap-2 text-sm text-[#59645D] sm:grid-cols-2">
                                        {transparencyIngredients.map((ingredient) => (
                                            <li key={ingredient} className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#344E41]" />
                                                {ingredient}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6C826A]">
                                    Safety & Caution
                                </p>
                                <h2 className="mt-3 font-serif text-3xl font-medium text-[#1E372B]">
                                    For your safety
                                </h2>
                                <ul className="mt-5 space-y-3 text-sm leading-7 text-[#3F4B43]">
                                    {safetyItems.map((item) => (
                                        <li key={item} className="flex gap-3">
                                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6C826A]" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-[#E5E2E1] bg-[#F8F4EA] px-6 py-5 text-center text-sm font-semibold text-[#344E41]">
                            Rooted in nature. Backed by research. Made for everyday care.
                        </div>
                    </section>
                </article>
            )}

            {selectedTab === "Reviews" && (
                <div className="mt-8 flex flex-col gap-6">
                    {product.rating?.length > 0 ? (
                        product.rating.map((item, index) => (
                            <div key={index} className="flex gap-5 rounded-2xl border border-[#E5E2E1] bg-white p-5">
                                <Image
                                    src={item.user.image}
                                    alt={item.user.name || "Customer"}
                                    className="size-10 rounded-full"
                                    width={100}
                                    height={100}
                                />
                                <div>
                                    <div className="flex items-center">
                                        {Array(5).fill('').map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                size={18}
                                                className='text-transparent'
                                                fill={item.rating >= i + 1 ? "#D8BD78" : "#D1D5DB"}
                                            />
                                        ))}
                                    </div>
                                    <p className="my-4 max-w-2xl text-sm leading-7 text-[#59645D]">
                                        {item.review}
                                    </p>
                                    <p className="font-semibold text-[#1E372B]">
                                        {item.user.name}
                                    </p>
                                    <p className="mt-2 text-xs text-[#8A918A]">
                                        {new Date(item.createdAt).toDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-[#8A918A]">No reviews yet.</p>
                    )}
                </div>
            )}

            {selectedTab === "FAQs" && (
                <div className="mt-8 max-w-3xl space-y-4">
                    {product.faqs?.length > 0 ? (
                        product.faqs.map((faq, index) => (
                            <div
                                key={faq.id}
                                className="rounded-2xl border border-[#E5E2E1] bg-white px-5 py-4 transition"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="flex w-full items-center justify-between gap-4 text-left"
                                >
                                    <span className="text-sm font-semibold text-[#1E372B]">
                                        {faq.question}
                                    </span>

                                    <ChevronDown
                                        size={17}
                                        className={`shrink-0 text-[#344E41] transition-transform ${
                                            openFaq === index ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        openFaq === index
                                            ? "mt-3 max-h-44 opacity-100"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <p className="text-sm leading-7 text-[#59645D]">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-[#8A918A]">
                            No FAQs available for this product.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-14 flex gap-3">
                <Image
                    src={product.store.logo}
                    alt={`${product.store.name} store logo`}
                    className="size-11 rounded-full ring ring-[#E5E2E1]"
                    width={100}
                    height={100}
                />
                <div>
                    <p className="font-semibold text-[#59645D]">
                        Product by {product.store.name}
                    </p>
                    <Link
                        href={`/shop/${product.store.username}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#344E41] hover:underline"
                    >
                        view store <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

        </section>
    )
}

export default ProductDescription
