import StoreLayout from "@/components/store/StoreLayout";
import {SignedIn, SignedOut, SignIn} from "@clerk/nextjs"
import { storePath } from "@/lib/privateRoutes";

export const metadata = {
    title: "K-Sarwar - Store Dashboard",
    description: "K-Sarwar - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>  
        <SignedIn>
            <StoreLayout>
                {children}
            </StoreLayout>
        </SignedIn>
        <SignedOut>
            <div className="min-h-screen flex items-center justify-center">
                <SignIn fallbackRedirectUrl={storePath()} routing="hash" />
            </div>
        </SignedOut>
            
        </>
    );
}
