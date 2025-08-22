import { useState } from "react";
import Header from "@/components/header";
import VisitorSignIn from "@/components/visitor-signin";
import VisitorSignOut from "@/components/visitor-signout";
import AdminLoginModal from "@/components/admin-login-modal";

export default function Home() {
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAdminClick={() => setShowAdminModal(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome!</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please sign in below to let your host know you've arrived. We'll take care of the rest.
            </p>
          </div>

          {/* Sign-in Form */}
          <VisitorSignIn />

          {/* Sign-out Section */}
          <VisitorSignOut />
        </div>
      </main>

      <AdminLoginModal 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
      />
    </div>
  );
}
