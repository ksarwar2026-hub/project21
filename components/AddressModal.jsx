'use client'
import { XIcon } from "lucide-react"
import { useState } from "react"

const emptyAddress = {
    name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: ''
}

const AddressModal = ({
    setShowAddressModal,
    initialAddress = emptyAddress,
    onSaveAddress,
    isSaving = false,
}) => {
    const [address, setAddress] = useState({
        ...emptyAddress,
        ...initialAddress,
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        await onSaveAddress(address)
    }

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 z-50 overflow-y-auto bg-white/70 px-4 py-6 backdrop-blur sm:px-6">
            <div className="mx-auto flex min-h-full w-full max-w-md items-center justify-center">
                <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-xl sm:p-6">
                    <button
                        type="button"
                        aria-label="Close address form"
                        className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setShowAddressModal(false)}
                    >
                        <XIcon size={20} />
                    </button>

                    <h2 className="pr-10 text-2xl font-medium text-slate-700">Delivery <span className="font-semibold">Address</span></h2>
                    <p className="mt-1 text-sm text-slate-500">We will keep these details ready for checkout.</p>

                    <div className="mt-5 grid gap-4">
                        <input name="name" onChange={handleAddressChange} value={address.name} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" placeholder="Full name" required />
                        <input name="email" onChange={handleAddressChange} value={address.email} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="email" placeholder="Email address" required />
                        <input name="street" onChange={handleAddressChange} value={address.street} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" placeholder="Street address" required />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <input name="city" onChange={handleAddressChange} value={address.city} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" placeholder="City" required />
                            <input name="state" onChange={handleAddressChange} value={address.state} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" placeholder="State" required />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <input name="zip" onChange={handleAddressChange} value={address.zip} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" inputMode="numeric" placeholder="Pincode" required />
                            <input name="country" onChange={handleAddressChange} value={address.country} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="text" placeholder="Country" required />
                        </div>
                        <input name="phone" onChange={handleAddressChange} value={address.phone} className="w-full rounded border border-slate-200 p-2.5 px-4 outline-none transition focus:border-slate-400" type="tel" inputMode="tel" placeholder="Phone number" required />
                        <button disabled={isSaving} className="min-h-11 rounded-md bg-slate-800 text-sm font-medium text-white transition-all hover:bg-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400">
                            {isSaving ? 'Saving...' : 'Save delivery details'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default AddressModal
