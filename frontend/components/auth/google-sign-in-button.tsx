import { ButtonLink } from "@/components/ui/button";

export function GoogleSignInButton() {
  return (
    <ButtonLink href="/dashboard" size="lg" className="w-full">
      Continue with Google
    </ButtonLink>
  );
}
