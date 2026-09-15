import { SignIn } from "@clerk/nextjs";

const clerkTouchAppearance = {
  elements: {
    formButtonPrimary: "min-h-11",
    socialButtonsBlockButton: "min-h-11",
    footerActionLink: "inline-flex min-h-11 items-center",
    formFieldInput: "min-h-11",
  },
} as const;

export default function SignInPage() {
  return (
    <main className="flex min-h-full items-center justify-center overflow-visible px-4 py-16 sm:px-8">
      <div className="w-full max-w-[25rem] overflow-visible">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={clerkTouchAppearance}
        />
      </div>
    </main>
  );
}
