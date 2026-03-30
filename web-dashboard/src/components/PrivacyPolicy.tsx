import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 py-12 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center text-red-500 hover:text-red-400 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: March 30, 2026</p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
            <p className="text-gray-300">
              Welcome to HabitX. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you use 
              our mobile application and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Data We Collect</h2>
            <p className="text-gray-300 mb-3">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li><strong className="text-white">Identity Data:</strong> includes username and profile picture.</li>
              <li><strong className="text-white">Contact Data:</strong> includes email address.</li>
              <li><strong className="text-white">Usage Data:</strong> includes information about how you use our app, the habits you track, and your progress (XP and levels).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Data</h2>
            <p className="text-gray-300 mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
              <li>To manage Your Account: to manage Your registration as a user of the Service.</li>
              <li>To contact You: To contact You by email regarding updates or informative communications related to the functionalities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Security</h2>
            <p className="text-gray-300">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used, or accessed in an unauthorized way, altered, or disclosed. Your data is securely stored and authenticated 
              via industry-standard providers (like Google and Firebase).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Your Legal Rights</h2>
            <p className="text-gray-300 mb-3">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at amanzzz@example.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
