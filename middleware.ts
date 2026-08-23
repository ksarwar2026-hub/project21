// import { clerkMiddleware } from '@clerk/nextjs/server';

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };




// import { clerkMiddleware } from '@clerk/nextjs/server';

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/pnnqyytx6b";
const storePath = process.env.NEXT_PUBLIC_STORE_PATH || "/stnwqx7b4";

export default clerkMiddleware((auth, request) => {
  const { pathname } = request.nextUrl;
  const isDirectAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isDirectStore = pathname === "/store" || pathname.startsWith("/store/");
  const isPrivateAlias =
    pathname === adminPath ||
    pathname.startsWith(`${adminPath}/`) ||
    pathname === storePath ||
    pathname.startsWith(`${storePath}/`);

  if ((isDirectAdmin || isDirectStore) && !isPrivateAlias) {
    return NextResponse.redirect(new URL("/", request.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
