import { RegisterForm } from "./components";

export function RegisterPage() {
  const handleSuccess = () => {
    // User needs to verify email, so we stay on this page with success message
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <RegisterForm onSuccess={handleSuccess} />
    </div>
  );
}
