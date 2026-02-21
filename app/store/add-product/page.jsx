// 'use client'
// import { assets } from "@/assets/assets"
// import { useAuth } from "@clerk/nextjs"
// import axios from "axios"
// import Image from "next/image"
// import { useState } from "react"
// import { toast } from "react-hot-toast"

// export default function StoreAddProduct() {

//     const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

//     const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
//     const [productInfo, setProductInfo] = useState({
//         name: "",
//         description: "",
//         mrp: 0,
//         price: 0,
//         category: "",
//     })
//     const [loading, setLoading] = useState(false)
//     const [aiUsed, setAiUsed] = useState(false)

//     const { getToken } = useAuth()

//     const onChangeHandler = (e) => {
//         setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
//     }

//     const handleImageUpload = async (key, file) => {
//         setImages(prev => ({ ...prev, [key]: file }))

//         if (key === "1" && file && !aiUsed) {
//             const reader = new FileReader()
//             reader.readAsDataURL(file)
//             reader.onloadend = async () => {
//                 const base64String = reader.result.split(",")[1]
//                 const mimeType = file.type
//                 const token = await getToken()

//                 try {
//                     await toast.promise(
//                         axios.post(
//                             "/api/store/ai",
//                             { base64Image: base64String, mimeType },
//                             { headers: { Authorization: `Bearer ${token}` } }
//                         ),
//                         {
//                             loading: "Analyzing image with AI...",
//                             success: (res) => {
//                                 console.log(res);
                                
//                                 const data = res.data
//                                 if (data.name && data.description) {
//                                     setProductInfo(prev => ({
//                                         ...prev,
//                                         name: data.name,
//                                         description: data.description
//                                     }))
//                                     setAiUsed(true)
//                                     return "AI filled product info 🎉"
//                                 }
//                                 return "AI could not analyze the image"
//                             },
//                             error: (err) =>
//                                 err?.response?.data?.error || err.message
//                         }
//                     )
//                 } catch (error) {
//                     console.error(error)
//                 }
//             }
//         }
//     }

//     const onSubmitHandler = async (e) => {
//         e.preventDefault()
//         try {
//             if (!images[1] && !images[2] && !images[3] && !images[4]) {
//                 return toast.error('Please upload at least one image')
//             }
//             setLoading(true)

//             const formData = new FormData()
//             formData.append('name', productInfo.name)
//             formData.append('description', productInfo.description)
//             formData.append('mrp', productInfo.mrp)
//             formData.append('price', productInfo.price)
//             formData.append('category', productInfo.category)

//             Object.keys(images).forEach((key) => {
//                 images[key] && formData.append('images', images[key])
//             })

//             const token = await getToken()
//             const { data } = await axios.post('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })
//             toast.success(data.message)

//             setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" })
//             setImages({ 1: null, 2: null, 3: null, 4: null })
//             setAiUsed(false)
//         } catch (error) {
//             toast.error(error?.response?.data?.error || error.message)
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })} className="text-slate-500 mb-28">
//             <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
//             <p className="mt-7">Product Images</p>

//             <div className="flex gap-3 mt-4">
//                 {Object.keys(images).map((key) => (
//                     <label key={key} htmlFor={`images${key}`}>
//                         <Image
//                             width={300}
//                             height={300}
//                             className='h-15 w-auto border border-slate-200 rounded cursor-pointer'
//                             src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area}
//                             alt=""
//                         />
//                         <input
//                             type="file"
//                             accept='image/*'
//                             id={`images${key}`}
//                             onChange={e => handleImageUpload(key, e.target.files[0])}
//                             hidden
//                         />
//                     </label>
//                 ))}
//             </div>

//             <label className="flex flex-col gap-2 my-6 ">
//                 Name
//                 <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
//             </label>

//             <label className="flex flex-col gap-2 my-6 ">
//                 Description
//                 <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
//             </label>

//             <div className="flex gap-5">
//                 <label className="flex flex-col gap-2 ">
//                     Actual Price ($)
//                     <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
//                 </label>
//                 <label className="flex flex-col gap-2 ">
//                     Offer Price ($)
//                     <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
//                 </label>
//             </div>

//             <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
//                 <option value="">Select a category</option>
//                 {categories.map((category) => (
//                     <option key={category} value={category}>{category}</option>
//                 ))}
//             </select>

//             <br />

//             <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
//         </form>
//     )
// }


//------------------------------------ temp ------------------------

// 'use client'

// import { assets } from "@/assets/assets"
// import { useAuth } from "@clerk/nextjs"
// import axios from "axios"
// import Image from "next/image"
// import { useState } from "react"
// import { toast } from "react-hot-toast"

// export default function StoreAddProduct() {

//     const categories = [
//         'Electronics',
//         'Clothing',
//         'Home & Kitchen',
//         'Beauty & Health',
//         'Toys & Games',
//         'Sports & Outdoors',
//         'Books & Media',
//         'Food & Drink',
//         'Hobbies & Crafts',
//         'Others'
//     ]

//     const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })

//     const [productInfo, setProductInfo] = useState({
//         name: "",
//         description: "",
//         mrp: 0,
//         price: 0,
//         category: "",
//     })

//     const [loading, setLoading] = useState(false)

//     const { getToken } = useAuth()

//     const onChangeHandler = (e) => {
//         setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
//     }

//     const handleImageUpload = (key, file) => {
//         setImages(prev => ({ ...prev, [key]: file }))
//     }

//     const onSubmitHandler = async (e) => {
//         e.preventDefault()

//         if (!images[1] && !images[2] && !images[3] && !images[4]) {
//             return toast.error('Please upload at least one image')
//         }

//         try {
//             setLoading(true)

//             const formData = new FormData()
//             formData.append('name', productInfo.name)
//             formData.append('description', productInfo.description)
//             formData.append('mrp', productInfo.mrp)
//             formData.append('price', productInfo.price)
//             formData.append('category', productInfo.category)

//             Object.keys(images).forEach((key) => {
//                 if (images[key]) {
//                     formData.append('images', images[key])
//                 }
//             })

//             const token = await getToken()

//             const { data } = await axios.post(
//                 '/api/store/product',
//                 formData,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             )

//             toast.success(data.message)

//             // Reset form
//             setProductInfo({
//                 name: "",
//                 description: "",
//                 mrp: 0,
//                 price: 0,
//                 category: "",
//             })

//             setImages({ 1: null, 2: null, 3: null, 4: null })

//         } catch (error) {
//             toast.error(error?.response?.data?.error || error.message)
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28">

//             <h1 className="text-2xl">
//                 Add New <span className="text-slate-800 font-medium">Products</span>
//             </h1>

//             <p className="mt-7">Product Images</p>

//             <div className="flex gap-3 mt-4">
//                 {Object.keys(images).map((key) => (
//                     <label key={key} htmlFor={`images${key}`}>
//                         <Image
//                             width={300}
//                             height={300}
//                             className='h-15 w-auto border border-slate-200 rounded cursor-pointer'
//                             src={
//                                 images[key]
//                                     ? URL.createObjectURL(images[key])
//                                     : assets.upload_area
//                             }
//                             alt=""
//                         />
//                         <input
//                             type="file"
//                             accept='image/*'
//                             id={`images${key}`}
//                             onChange={e => handleImageUpload(key, e.target.files[0])}
//                             hidden
//                         />
//                     </label>
//                 ))}
//             </div>

//             <label className="flex flex-col gap-2 my-6">
//                 Name
//                 <input
//                     type="text"
//                     name="name"
//                     onChange={onChangeHandler}
//                     value={productInfo.name}
//                     placeholder="Enter product name"
//                     className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded"
//                     required
//                 />
//             </label>

//             <label className="flex flex-col gap-2 my-6">
//                 Description
//                 <textarea
//                     name="description"
//                     onChange={onChangeHandler}
//                     value={productInfo.description}
//                     placeholder="Enter product description"
//                     rows={5}
//                     className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none"
//                     required
//                 />
//             </label>

//             <div className="flex gap-5">
//                 <label className="flex flex-col gap-2">
//                     Actual Price ($)
//                     <input
//                         type="number"
//                         name="mrp"
//                         onChange={onChangeHandler}
//                         value={productInfo.mrp}
//                         placeholder="0"
//                         className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
//                         required
//                     />
//                 </label>

//                 <label className="flex flex-col gap-2">
//                     Offer Price ($)
//                     <input
//                         type="number"
//                         name="price"
//                         onChange={onChangeHandler}
//                         value={productInfo.price}
//                         placeholder="0"
//                         className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
//                         required
//                     />
//                 </label>
//             </div>

//             <select
//                 onChange={e => setProductInfo({ ...productInfo, category: e.target.value })}
//                 value={productInfo.category}
//                 className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded"
//                 required
//             >
//                 <option value="">Select a category</option>
//                 {categories.map((category) => (
//                     <option key={category} value={category}>
//                         {category}
//                     </option>
//                 ))}
//             </select>

//             <button
//                 disabled={loading}
//                 className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition"
//             >
//                 {loading ? "Adding..." : "Add Product"}
//             </button>

//         </form>
//     )
// }




//--------------------------------------FAQs Update-------------------------

'use client'

import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function StoreAddProduct() {

    const categories = [
        'Electronics',
        'Clothing',
        'Home & Kitchen',
        'Beauty & Health',
        'Toys & Games',
        'Sports & Outdoors',
        'Books & Media',
        'Food & Drink',
        'Hobbies & Crafts',
        'Others'
    ]

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })

    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })

    // ✅ FAQ STATE
    const [faqs, setFaqs] = useState([
        { question: "", answer: "" }
    ])

    const [loading, setLoading] = useState(false)

    const { getToken } = useAuth()

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const handleImageUpload = (key, file) => {
        setImages(prev => ({ ...prev, [key]: file }))
    }

    // ✅ FAQ HANDLERS
    const handleFaqChange = (index, field, value) => {
        const updated = [...faqs]
        updated[index][field] = value
        setFaqs(updated)
    }

    const addFaqField = () => {
        setFaqs([...faqs, { question: "", answer: "" }])
    }

    const removeFaqField = (index) => {
        const updated = faqs.filter((_, i) => i !== index)
        setFaqs(updated)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        if (!images[1] && !images[2] && !images[3] && !images[4]) {
            return toast.error('Please upload at least one image')
        }

        try {
            setLoading(true)

            const formData = new FormData()

            formData.append('name', productInfo.name)
            formData.append('description', productInfo.description)
            formData.append('mrp', productInfo.mrp)
            formData.append('price', productInfo.price)
            formData.append('category', productInfo.category)

            // ✅ ADD FAQ DATA
            formData.append('faqs', JSON.stringify(faqs))

            Object.keys(images).forEach((key) => {
                if (images[key]) {
                    formData.append('images', images[key])
                }
            })

            const token = await getToken()

            const { data } = await axios.post(
                '/api/store/product',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            toast.success(data.message)

            // Reset form
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })

            setImages({ 1: null, 2: null, 3: null, 4: null })
            setFaqs([{ question: "", answer: "" }])

        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28">

            <h1 className="text-2xl">
                Add New <span className="text-slate-800 font-medium">Products</span>
            </h1>

            <p className="mt-7">Product Images</p>

            <div className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image
                            width={300}
                            height={300}
                            className='h-15 w-auto border border-slate-200 rounded cursor-pointer'
                            src={
                                images[key]
                                    ? URL.createObjectURL(images[key])
                                    : assets.upload_area
                            }
                            alt=""
                        />
                        <input
                            type="file"
                            accept='image/*'
                            id={`images${key}`}
                            onChange={e => handleImageUpload(key, e.target.files[0])}
                            hidden
                        />
                    </label>
                ))}
            </div>

            <label className="flex flex-col gap-2 my-6">
                Name
                <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={productInfo.name}
                    placeholder="Enter product name"
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded"
                    required
                />
            </label>

            <label className="flex flex-col gap-2 my-6">
                Description
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    placeholder="Enter product description"
                    rows={5}
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                    required
                />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2">
                    Actual Price ($)
                    <input
                        type="number"
                        name="mrp"
                        onChange={onChangeHandler}
                        value={productInfo.mrp}
                        placeholder="0"
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    Offer Price ($)
                    <input
                        type="number"
                        name="price"
                        onChange={onChangeHandler}
                        value={productInfo.price}
                        placeholder="0"
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
                        required
                    />
                </label>
            </div>

            <select
                onChange={e => setProductInfo({ ...productInfo, category: e.target.value })}
                value={productInfo.category}
                className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded"
                required
            >
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>
                        {category}
                    </option>
                ))}
            </select>

            {/* ✅ FAQ UI */}
            <div className="mt-8 max-w-sm">
                <h3 className="text-lg font-medium text-slate-700 mb-4">
                    Product FAQs
                </h3>

                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-4 mb-4 bg-white"
                    >
                        <input
                            type="text"
                            placeholder="Enter question"
                            className="w-full border p-2 rounded mb-3 text-sm"
                            value={faq.question}
                            onChange={(e) =>
                                handleFaqChange(index, "question", e.target.value)
                            }
                        />

                        <textarea
                            placeholder="Enter answer"
                            rows={3}
                            className="w-full border p-2 rounded text-sm"
                            value={faq.answer}
                            onChange={(e) =>
                                handleFaqChange(index, "answer", e.target.value)
                            }
                        />

                        {faqs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeFaqField(index)}
                                className="text-red-500 text-xs mt-2"
                            >
                                Remove FAQ
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addFaqField}
                    className="text-sm text-slate-600 hover:underline"
                >
                    + Add Another FAQ
                </button>
            </div>

            <button
                disabled={loading}
                className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition"
            >
                {loading ? "Adding..." : "Add Product"}
            </button>

        </form>
    )
}