export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 22, 2026</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">ClassCast.ai collects the following information when you use our app:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Name and email address (provided by your school)</li>
        <li>Video recordings you submit for assignments</li>
        <li>Profile information you choose to add (photo, bio)</li>
        <li>Assignment grades and feedback from instructors</li>
        <li>Interactions with peer videos (likes, ratings, comments)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <p className="mb-4">We use your information to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Provide and maintain the ClassCast learning platform</li>
        <li>Enable video-based assignment submission and peer review</li>
        <li>Display grades and feedback from your instructors</li>
        <li>Send notifications about assignments and due dates</li>
        <li>Improve our services</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Storage & Security</h2>
      <p className="mb-4">Your data is stored securely on Amazon Web Services (AWS) infrastructure in the United States. Video files are stored in encrypted S3 buckets. We use industry-standard security measures to protect your information.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <p className="mb-4">We do not sell your personal information. Your data is shared only with:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Your instructors (grades, submissions, feedback)</li>
        <li>Your classmates (video submissions visible within assigned peer review)</li>
        <li>School administrators as required</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Camera & Microphone</h2>
      <p className="mb-4">ClassCast requests access to your device camera and microphone solely for recording video assignments. We do not access your camera or microphone without your explicit action (tapping Record).</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Children&apos;s Privacy</h2>
      <p className="mb-4">ClassCast is used in educational settings. Student accounts are created by school administrators. We comply with COPPA and FERPA regulations regarding student data.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Your Rights</h2>
      <p className="mb-4">You may request access to, correction of, or deletion of your personal data by contacting your school administrator or emailing us at support@class-cast.com.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact</h2>
      <p className="mb-4">For questions about this privacy policy, contact:<br />ClassCast.ai<br />Email: support@class-cast.com</p>
    </div>
  );
}
