import { Navbar } from "@/components/layout/Navbar";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function ChangePassword() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 py-8 lg:px-5">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
