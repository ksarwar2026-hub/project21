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
    country: 'IN',
    phone: ''
}

function normalizeIndianPhoneForDisplay(value) {
    if (typeof value !== 'string') {
        return ''
    }

    const rawValue = value.trim()
    const digits = rawValue.replace(/\D/g, '')

    if (/^[6-9]\d{9}$/.test(digits)) {
        return digits
    }

    if (
        rawValue.startsWith('+') &&
        digits.length === 12 &&
        digits.startsWith('91') &&
        /^[6-9]\d{9}$/.test(digits.slice(2))
    ) {
        return digits.slice(2)
    }

    return ''
}

function normalizeInitialAddress(initialAddress) {
    const nextAddress = {
        ...emptyAddress,
        ...initialAddress,
    }

    return {
        ...nextAddress,
        phone: normalizeIndianPhoneForDisplay(nextAddress.phone),
    }
}

const AddressModal = ({
    setShowAddressModal,
    initialAddress = emptyAddress,
    onSaveAddress,
    isSaving = false,
}) => {
    const [address, setAddress] = useState(() => normalizeInitialAddress(initialAddress))
    const [phoneInputError, setPhoneInputError] = useState('')

    const rejectPhoneInput = () => {
        setPhoneInputError('Enter only the 10-digit Indian mobile number without +91.')
        setAddress((currentAddress) => ({
            ...currentAddress,
            phone: '',
        }))
    }

    const handlePhonePaste = (e) => {
        const pastedDigits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '')

        if (pastedDigits.length > 10) {
            e.preventDefault()
            rejectPhoneInput()
        }
    }

    const handlePhoneKeyDown = (e) => {
        if (!/^[0-9]$/.test(e.key)) {
            return
        }

        const selectionStart = e.currentTarget.selectionStart ?? address.phone.length
        const selectionEnd = e.currentTarget.selectionEnd ?? address.phone.length
        const nextLength = address.phone.length - (selectionEnd - selectionStart) + 1

        if (nextLength > 10) {
            e.preventDefault()
            rejectPhoneInput()
        }
    }

    const handleAddressChange = (e) => {
        if (e.target.name === 'phone') {
            const digits = e.target.value.replace(/\D/g, '')

            if (digits.length > 10) {
                rejectPhoneInput()
                return
            }

            setPhoneInputError('')

            setAddress((currentAddress) => ({
                ...currentAddress,
                phone: digits,
            }))
            return
        }

        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isSubmitDisabled) {
            return
        }
        await onSaveAddress(address)
    }
    const hasValidPhone = /^[6-9]\d{9}$/.test(address.phone)
    const isSubmitDisabled =
        isSaving ||
        !hasValidPhone

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
                            <input name="country" value="IN" className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 px-4 outline-none" type="text" aria-label="Country" readOnly required />
                        </div>
                        <div className="flex w-full rounded border border-slate-200 outline-none transition focus-within:border-slate-400">
                            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-slate-600" aria-hidden="true">+91</span>
                            <input
                                name="phone"
                                onChange={handleAddressChange}
                                onPaste={handlePhonePaste}
                                onKeyDown={handlePhoneKeyDown}
                                value={address.phone}
                                className="min-w-0 flex-1 rounded-r p-2.5 px-4 outline-none"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                pattern="[6-9][0-9]{9}"
                                placeholder="10-digit mobile number"
                                required
                            />
                        </div>
                        {phoneInputError && (
                            <p className="text-xs text-red-600">{phoneInputError}</p>
                        )}
                        {!hasValidPhone && address.phone && (
                            <p className="text-xs text-red-600">Enter a valid 10-digit Indian mobile number.</p>
                        )}
                        <button disabled={isSubmitDisabled} className="min-h-11 rounded-md bg-slate-800 text-sm font-medium text-white transition-all hover:bg-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400">
                            {isSaving ? 'Saving...' : 'Save delivery details'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default AddressModal
