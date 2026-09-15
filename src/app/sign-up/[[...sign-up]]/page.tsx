import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-full items-center justify-center overflow-visible px-4 py-16 sm:px-8">
      <div className="w-full max-w-[25rem] overflow-visible [&_button]:min-h-11 [&_a]:min-h-11 [&_a]:inline-flex [&_a]:items-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
