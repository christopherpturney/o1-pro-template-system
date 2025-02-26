/*
 * Middleware for protecting routes, checking user authentication, and redirecting users.
 * Redirects users to dashboard after successful login for better UX.
 */

import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default clerkMiddleware(async (auth, req) => {
  // Get authentication information
  const { userId } = await auth();
  const nextUrl = (req as NextRequest).nextUrl;

  // Define public routes (these won't require authentication)
  const isPublicRoute = [
    "/",
    "/login(.*)",
    "/signup(.*)",
    "/api/webhook(.*)",
    "/pricing"
  ].some(pattern => {
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(nextUrl.pathname);
  });

  // If the user is logged in and trying to access a protected route, allow them to access route
  if (userId) {
    return NextResponse.next();
  }
  
  // If the user is not logged in and it's a public route, allow them to access route
  if (!userId && isPublicRoute) {
    return NextResponse.next();
  }
  
  // If the user is not logged in and it's not a public route, redirect them to sign-in
  const signInUrl = new URL('/login', nextUrl.origin);
  signInUrl.searchParams.set('redirect_url', nextUrl.href);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
