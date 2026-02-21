// 'use client'
// import { ArrowRight, StarIcon } from "lucide-react"
// import Image from "next/image"
// import Link from "next/link"
// import { useState } from "react"

// const ProductDescription = ({ product }) => {

//     const [selectedTab, setSelectedTab] = useState('Description')

//     return (
//         <div className="my-18 text-sm text-slate-600">

//             {/* Tabs */}
//             <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
//                 {['Description', 'Reviews'].map((tab, index) => (
//                     <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
//                         {tab}
//                     </button>
//                 ))}
//             </div>

//             {/* Description */}
//             {selectedTab === "Description" && (
//                 <p className="max-w-xl">{product.description}</p>
//             )}

//             {/* Reviews */}
//             {selectedTab === "Reviews" && (
//                 <div className="flex flex-col gap-3 mt-14">
//                     {product.rating.map((item,index) => (
//                         <div key={index} className="flex gap-5 mb-10">
//                             <Image src={item.user.image} alt="" className="size-10 rounded-full" width={100} height={100} />
//                             <div>
//                                 <div className="flex items-center" >
//                                     {Array(5).fill('').map((_, index) => (
//                                         <StarIcon key={index} size={18} className='text-transparent mt-0.5' fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
//                                     ))}
//                                 </div>
//                                 <p className="text-sm max-w-lg my-4">{item.review}</p>
//                                 <p className="font-medium text-slate-800">{item.user.name}</p>
//                                 <p className="mt-3 font-light">{new Date(item.createdAt).toDateString()}</p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* Store Page */}
//             <div className="flex gap-3 mt-14">
//                 <Image src={product.store.logo} alt="" className="size-11 rounded-full ring ring-slate-400" width={100} height={100} />
//                 <div>
//                     <p className="font-medium text-slate-600">Product by {product.store.name}</p>
//                     <Link href={`/shop/${product.store.username}`} className="flex items-center gap-1.5 text-green-500"> view store <ArrowRight size={14} /></Link>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default ProductDescription

//--------------------------------------updated GPT ------------------------

// 'use client'

// import { ArrowRight, StarIcon } from "lucide-react"
// import Image from "next/image"
// import Link from "next/link"
// import { useState } from "react"
// import ReactMarkdown from "react-markdown"
// import remarkGfm from "remark-gfm"
// import remarkBreaks from "remark-breaks"

// const ProductDescription = ({ product }) => {

//     const [selectedTab, setSelectedTab] = useState('Description')
//     const [expanded, setExpanded] = useState(false)

//     return (
//         <div className="my-18 text-sm text-slate-600">

//             {/* Tabs */}
//             <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
//                 {['Description', 'Reviews'].map((tab, index) => (
//                     <button
//                         className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold text-slate-800' : 'text-slate-400'} px-3 py-2 font-medium`}
//                         key={index}
//                         onClick={() => setSelectedTab(tab)}
//                     >
//                         {tab}
//                     </button>
//                 ))}
//             </div>

//             {/* Description with Read More */}
//             {selectedTab === "Description" && (
//                 <div className="max-w-2xl text-sm leading-6 text-slate-500">

//                     <div
//                         className={`relative overflow-hidden transition-all duration-300 ${
//                             expanded ? "max-h-full" : "max-h-32"
//                         }`}
//                     >
//                         <ReactMarkdown
//                             remarkPlugins={[remarkGfm, remarkBreaks]}
//                             components={{
//                                 h1: ({node, ...props}) => (
//                                     <h1 className="text-lg font-semibold mt-4 mb-2 text-slate-700" {...props} />
//                                 ),
//                                 h2: ({node, ...props}) => (
//                                     <h2 className="text-base font-semibold mt-4 mb-2 text-slate-700" {...props} />
//                                 ),
//                                 h3: ({node, ...props}) => (
//                                     <h3 className="text-sm font-semibold mt-3 mb-1 text-slate-700" {...props} />
//                                 ),
//                                 p: ({node, ...props}) => (
//                                     <p className="text-sm leading-6" {...props} />
//                                 ),
//                                 ul: ({node, ...props}) => (
//                                     <ul className="list-disc pl-5 space-y-1" {...props} />
//                                 ),
//                                 ol: ({node, ...props}) => (
//                                     <ol className="list-decimal pl-5 space-y-1" {...props} />
//                                 ),
//                                 li: ({node, ...props}) => (
//                                     <li className="text-sm" {...props} />
//                                 ),
//                                 strong: ({node, ...props}) => (
//                                     <strong className="font-semibold text-slate-700" {...props} />
//                                 ),
//                             }}
//                         >
//                             {product.description}
//                         </ReactMarkdown>

//                         {/* Fade effect when collapsed */}
//                         {!expanded && (
//                            <div className="absolute bottom-0 left-0 w-full h-10 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
//                         )}
//                     </div>

//                     {/* Read More Button */}
//                     <button
//                         onClick={() => setExpanded(!expanded)}
//                         className="mt-3 text-green-600 text-sm font-medium hover:underline"
//                     >
//                         {expanded ? "Read Less" : "Read More"}
//                     </button>

//                 </div>
//             )}

//             {/* Reviews */}
//             {selectedTab === "Reviews" && (
//                 <div className="flex flex-col gap-3 mt-14">
//                     {product.rating.map((item, index) => (
//                         <div key={index} className="flex gap-5 mb-10">
//                             <Image
//                                 src={item.user.image}
//                                 alt=""
//                                 className="size-10 rounded-full"
//                                 width={100}
//                                 height={100}
//                             />
//                             <div>
//                                 <div className="flex items-center">
//                                     {Array(5).fill('').map((_, index) => (
//                                         <StarIcon
//                                             key={index}
//                                             size={18}
//                                             className='text-transparent mt-0.5'
//                                             fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"}
//                                         />
//                                     ))}
//                                 </div>
//                                 <p className="text-sm max-w-lg my-4">
//                                     {item.review}
//                                 </p>
//                                 <p className="font-medium text-slate-800">
//                                     {item.user.name}
//                                 </p>
//                                 <p className="mt-3 font-light">
//                                     {new Date(item.createdAt).toDateString()}
//                                 </p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* Store Page */}
//             <div className="flex gap-3 mt-14">
//                 <Image
//                     src={product.store.logo}
//                     alt=""
//                     className="size-11 rounded-full ring ring-slate-400"
//                     width={100}
//                     height={100}
//                 />
//                 <div>
//                     <p className="font-medium text-slate-600">
//                         Product by {product.store.name}
//                     </p>
//                     <Link
//                         href={`/shop/${product.store.username}`}
//                         className="flex items-center gap-1.5 text-green-500"
//                     >
//                         view store <ArrowRight size={14} />
//                     </Link>
//                 </div>
//             </div>

//         </div>
//     )
// }

// export default ProductDescription



//--------------------------updated FAQs ----------------------------


'use client'

import { ArrowRight, StarIcon, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')
    const [expanded, setExpanded] = useState(false)
    const [openFaq, setOpenFaq] = useState(null)

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews', 'FAQs'].map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-3 py-2 font-medium transition-all duration-300
                        ${tab === selectedTab
                                ? 'border-b-[1.5px] font-semibold text-slate-800'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ================= DESCRIPTION ================= */}
            {selectedTab === "Description" && (
                <div className="max-w-2xl text-sm leading-6 text-slate-500">

                    <div
                        className={`relative overflow-hidden transition-all duration-300 ${
                            expanded ? "max-h-full" : "max-h-32"
                        }`}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                h1: ({node, ...props}) => (
                                    <h1 className="text-lg font-semibold mt-4 mb-2 text-slate-700" {...props} />
                                ),
                                h2: ({node, ...props}) => (
                                    <h2 className="text-base font-semibold mt-4 mb-2 text-slate-700" {...props} />
                                ),
                                h3: ({node, ...props}) => (
                                    <h3 className="text-sm font-semibold mt-3 mb-1 text-slate-700" {...props} />
                                ),
                                p: ({node, ...props}) => (
                                    <p className="text-sm leading-6" {...props} />
                                ),
                                ul: ({node, ...props}) => (
                                    <ul className="list-disc pl-5 space-y-1" {...props} />
                                ),
                                ol: ({node, ...props}) => (
                                    <ol className="list-decimal pl-5 space-y-1" {...props} />
                                ),
                                li: ({node, ...props}) => (
                                    <li className="text-sm" {...props} />
                                ),
                                strong: ({node, ...props}) => (
                                    <strong className="font-semibold text-slate-700" {...props} />
                                ),
                            }}
                        >
                            {product.description}
                        </ReactMarkdown>

                        {!expanded && (
                           <div className="absolute bottom-0 left-0 w-full h-10 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
                        )}
                    </div>

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-3 text-green-600 text-sm font-medium hover:underline"
                    >
                        {expanded ? "Read Less" : "Read More"}
                    </button>
                </div>
            )}

            {/* ================= REVIEWS ================= */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14">
                    {product.rating?.length > 0 ? (
                        product.rating.map((item, index) => (
                            <div key={index} className="flex gap-5 mb-10">
                                <Image
                                    src={item.user.image}
                                    alt=""
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
                                                className='mt-0.5'
                                                fill={item.rating >= i + 1 ? "#00C950" : "#D1D5DB"}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm max-w-lg my-4">
                                        {item.review}
                                    </p>
                                    <p className="font-medium text-slate-800">
                                        {item.user.name}
                                    </p>
                                    <p className="mt-3 font-light text-xs text-slate-400">
                                        {new Date(item.createdAt).toDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-sm">No reviews yet.</p>
                    )}
                </div>
            )}

            {/* ================= FAQ SECTION ================= */}
            {/* ---------version 1 ------------*/}
            {selectedTab === "FAQs" && (
                <div className="max-w-2xl mt-8 space-y-4">

                    {product.faqs?.length > 0 ? (
                    product.faqs.map((faq, index) => (
                        <div
                        key={faq.id}
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 transition-all duration-300"
                        >

                        {/* Question */}
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center text-left"
                        >
                            <span className="text-sm font-medium text-slate-700">
                            {faq.question}
                            </span>

                            <span
                            className={`text-xs transition-transform duration-300 ${
                                openFaq === index ? "rotate-180" : ""
                            }`}
                            >
                            ▼
                            </span>
                        </button>

                        {/* Answer */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            openFaq === index
                                ? "max-h-40 mt-3 opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                        >
                            <p className="text-sm text-slate-500 leading-6">
                            {faq.answer}
                            </p>
                        </div>

                        </div>
                    ))
                    ) : (
                    <p className="text-sm text-slate-400">
                        No FAQs available for this product.
                    </p>
                    )}

                </div>
            )}

            {/* ================= STORE SECTION ================= */}
            <div className="flex gap-3 mt-14">
                <Image
                    src={product.store.logo}
                    alt=""
                    className="size-11 rounded-full ring ring-slate-300"
                    width={100}
                    height={100}
                />
                <div>
                    <p className="font-medium text-slate-600">
                        Product by {product.store.name}
                    </p>
                    <Link
                        href={`/shop/${product.store.username}`}
                        className="flex items-center gap-1.5 text-green-500 hover:underline"
                    >
                        view store <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

        </div>
    )
}

export default ProductDescription