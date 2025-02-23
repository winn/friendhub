import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="gradient-card rounded-2xl shadow-fun p-8">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-primary-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-primary-600" />
        </button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-fun-red to-fun-mint bg-clip-text text-transparent">
          Terms of Service
        </h1>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="text-gray-600 mb-4">
            We provide an AI chat platform that allows users to interact with AI agents. The service includes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 mb-4">
            <li>Creation and customization of AI agents</li>
            <li>Chat interactions with AI agents</li>
            <li>Points system for usage</li>
            <li>User profile management</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Obligations</h2>
          <p className="text-gray-600 mb-4">
            Users agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-600 mb-4">
            <li>Provide accurate information</li>
            <li>Maintain the security of their account</li>
            <li>Not use the service for any illegal purposes</li>
            <li>Not interfere with the service's operation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Points and Payments</h2>
          <p className="text-gray-600 mb-4">
            Users understand that:
          </p>
          <ul className="list-disc pl-6 text-gray-600 mb-4">
            <li>Points are required for using the service</li>
            <li>Points can be purchased through our platform</li>
            <li>Points are non-refundable</li>
            <li>We reserve the right to modify the points system</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
          <p className="text-gray-600 mb-4">
            All content and functionality on this platform, including but not limited to text, graphics, logos, and software, is the property of our company and is protected by copyright laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Changes to Terms</h2>
          <p className="text-gray-600 mb-4">
            We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new terms on the platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
          <p className="text-gray-600">
            For any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:admin@botnoigroup.com" className="text-fun-red hover:text-fun-red/80">
              admin@botnoigroup.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}