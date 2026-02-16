'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function AdminCoupons() {

    const { getToken } = useAuth()

    const [coupons, setCoupons] = useState([])
    const [deleteCode, setDeleteCode] = useState(null)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: '',
        forNewUser: false,
        forMember: false,
        isPublic: false,
        expiresAt: new Date()
    })

    const fetchCoupons = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(
                '/api/admin/coupon',
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setCoupons(data.coupons)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()

        const upperCode = newCoupon.code.trim().toUpperCase()

        // Duplicate check (frontend level)
        if (coupons.some(c => c.code === upperCode)) {
            toast.error("Coupon code already exists")
            return
        }

        if (isNaN(new Date(newCoupon.expiresAt))) {
            toast.error("Please enter a valid expiry date")
            return
        }

        try {
            const token = await getToken()

            const payload = {
                ...newCoupon,
                code: upperCode,
                discount: Number(newCoupon.discount),
                expiresAt: new Date(newCoupon.expiresAt)
            }

            const { data } = await axios.post(
                '/api/admin/coupon',
                { coupon: payload },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            toast.success(data.message)
            await fetchCoupons()

            setNewCoupon({
                code: '',
                description: '',
                discount: '',
                forNewUser: false,
                forMember: false,
                isPublic: false,
                expiresAt: new Date()
            })

        } catch (error) {
            if (error?.response?.data?.error?.includes("P2002")) {
                toast.error("Coupon code already exists")
            } else {
                toast.error(error?.response?.data?.error || error.message)
            }
        }
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    const deleteCoupon = async (code) => {
        try {
            const token = await getToken()
            await axios.delete(
                `/api/admin/coupon?code=${code}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            await fetchCoupons()
            toast.success("Coupon deleted successfully")
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    return (
        <div className="text-slate-500 mb-40">

            {/* Add Coupon */}
            <form
                onSubmit={(e) =>
                    toast.promise(
                        handleAddCoupon(e),
                        { loading: "Adding coupon..." }
                    )
                }
                className="max-w-sm text-sm"
            >
                <h2 className="text-2xl">
                    Add <span className="text-slate-800 font-medium">Coupons</span>
                </h2>

                <div className="flex gap-2 max-sm:flex-col mt-2">
                    <input
                        type="text"
                        placeholder="Coupon Code"
                        className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="code"
                        value={newCoupon.code}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Coupon Discount (%)"
                        min={1}
                        max={100}
                        className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="discount"
                        value={newCoupon.discount}
                        onChange={handleChange}
                        required
                    />
                </div>

                <input
                    type="text"
                    placeholder="Coupon Description"
                    className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                    name="description"
                    value={newCoupon.description}
                    onChange={handleChange}
                    required
                />

                <label>
                    <p className="mt-3">Coupon Expiry Date</p>
                    <input
                        type="date"
                        className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="expiresAt"
                        value={
                            newCoupon.expiresAt
                                ? format(new Date(newCoupon.expiresAt), "yyyy-MM-dd")
                                : ""
                        }
                        onChange={handleChange}
                        required
                    />
                </label>

                {/* Toggles */}
                <div className="mt-5">

                    <div className="flex gap-2 mt-3">
                        <label className="relative inline-flex items-center cursor-pointer gap-3">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={newCoupon.forNewUser}
                                onChange={(e) =>
                                    setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })
                                }
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </label>
                        <p>For New User</p>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <label className="relative inline-flex items-center cursor-pointer gap-3">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={newCoupon.forMember}
                                onChange={(e) =>
                                    setNewCoupon({ ...newCoupon, forMember: e.target.checked })
                                }
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </label>
                        <p>For Member</p>
                    </div>

                </div>

                <button className="mt-4 p-2 px-10 rounded bg-slate-700 text-white active:scale-95 transition">
                    Add Coupon
                </button>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl">
                    List <span className="text-slate-800 font-medium">Coupons</span>
                </h2>

                <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200 max-w-4xl">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Expires At</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">New User</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">For Member</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                            {coupons.map((coupon) => (
                                <tr key={coupon.code} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium text-slate-800">{coupon.code}</td>
                                    <td className="py-3 px-4">{coupon.description}</td>
                                    <td className="py-3 px-4">{coupon.discount}%</td>
                                    <td className="py-3 px-4">
                                        {format(new Date(coupon.expiresAt), "yyyy-MM-dd")}
                                    </td>
                                    <td className="py-3 px-4">{coupon.forNewUser ? 'Yes' : 'No'}</td>
                                    <td className="py-3 px-4">{coupon.forMember ? 'Yes' : 'No'}</td>
                                    <td className="py-3 px-4">
                                        <DeleteIcon
                                            onClick={() => setDeleteCode(coupon.code)}
                                            className="w-5 h-5 text-red-500 hover:text-red-800 cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteCode && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-80">
                        <h3 className="text-lg font-semibold text-slate-800">Delete Coupon</h3>

                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to delete
                            <span className="font-semibold text-slate-800"> {deleteCode} </span>?
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setDeleteCode(null)}
                                className="px-4 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    toast.promise(
                                        deleteCoupon(deleteCode),
                                        { loading: "Deleting coupon..." }
                                    )
                                    setDeleteCode(null)
                                }}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
