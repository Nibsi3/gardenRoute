"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Navigation, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  // Map NextAuth error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    Signin: "The sign-in flow was interrupted. Please try again.",
    OAuthSignin: "Google Auth failed. This usually means GOOGLE_CLIENT_ID is missing or incorrect in .env.local.",
    OAuthCallback: "Google returned an error. Check your redirect URIs in Google Cloud Console.",
    OAuthCreateAccount: "Could not create user account with Google.",
    EmailCreateAccount: "Could not create user account.",
    Callback: "Authentication callback failed.",
    OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
    EmailSignin: "The e-mail could not be sent.",
    CredentialsSignin: "Sign in failed. Check your details.",
    SessionRequired: "Please sign in to access this page.",
    Configuration: "Auth configuration error. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local.",
    default: "An error occurred. Please try again.",
  };

  const errorMessage = error ? (errorMessages[error] || errorMessages.default) : null;

  return (
    <div className="fixed inset-0 w-full bg-[#020408] text-white flex items-center justify-center overflow-hidden font-sans p-4">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/40 via-[#020408]/70 to-[#020408] z-10" />
        <Image
          src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=2574&auto=format&fit=crop"
          alt="Garden Route"
          fill
          className="object-cover opacity-20"
          priority
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] z-10"
      >
        <div className="glass-morphism border border-white/10 rounded-[24px] p-6 shadow-2xl backdrop-blur-3xl text-center relative">
          {/* Back Button */}
          <Link 
            href="/"
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          {/* Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <Navigation className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="space-y-0.5 mb-5">
            <h1 className="text-xl font-black text-white tracking-tight">
              Spotlight <span className="text-sky-400">Garden Route</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-medium leading-tight">
              Your personalized coastline guide.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-400 text-[10px] text-left leading-snug"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5 italic text-[9px]">Error Code: {error}</span>
                <span>{errorMessage}</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <button
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  await signIn("google", { callbackUrl });
                } catch (err) {
                  setIsLoading(false);
                  console.error("Sign in error:", err);
                }
              }}
              className="relative w-full flex items-center justify-center gap-2 bg-white text-slate-950 font-bold py-2.5 px-4 rounded-xl hover:bg-sky-50 transition-all active:scale-[0.98] text-xs disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
            
            <div className="flex items-center gap-1.5 justify-center text-sky-400/60 text-[9px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>Secure Authentication</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-4 text-slate-500 text-[9px] leading-relaxed px-6 opacity-60">
          By signing in, you agree to our 
          <Link href="/about" className="text-slate-400 hover:text-white underline mx-1">Terms</Link> 
          &
          <Link href="/about" className="text-slate-400 hover:text-white underline mx-1">Privacy</Link>.
        </p>
      </motion.div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#020408] flex items-center justify-center text-white text-xs">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
