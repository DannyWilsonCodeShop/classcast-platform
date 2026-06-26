export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 26, 2026</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">ClassCast.ai collects the following information when you use our app:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li><strong>Account Information:</strong> Name and email address (provided by your school or during signup)</li>
        <li><strong>Camera &amp; Microphone Recordings:</strong> Video and audio recordings you create and submit for class assignments</li>
        <li><strong>Photo Library Access:</strong> Photos or videos you choose to upload from your device library for assignments or your profile</li>
        <li><strong>Profile Information:</strong> Optional information you add (profile photo, bio, career goals, hobbies)</li>
        <li><strong>Academic Data:</strong> Assignment grades, instructor feedback, course enrollments</li>
        <li><strong>Interaction Data:</strong> Likes, ratings, and comments on peer video submissions</li>
        <li><strong>Device Information:</strong> Device type and operating system version (for app compatibility)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <p className="mb-4">All data collected is used exclusively for <strong>App Functionality</strong> — providing and maintaining the ClassCast educational platform. Specifically:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Enable video-based assignment submission and peer review</li>
        <li>Display grades and feedback from your instructors</li>
        <li>Send notifications about assignments and due dates</li>
        <li>Allow peer interaction through ratings and comments</li>
        <li>Maintain your profile and course enrollments</li>
      </ul>
      <p className="mb-4 font-medium">We do NOT use your data for advertising, analytics tracking, or any purpose other than providing the educational service.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Camera, Microphone &amp; Photo Library</h2>
      <p className="mb-4">ClassCast requests access to your device&apos;s camera, microphone, and photo library for the following purposes:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li><strong>Camera &amp; Microphone:</strong> Used solely to record video assignments when you explicitly tap the Record button. We never access your camera or microphone in the background or without your direct action.</li>
        <li><strong>Photo Library (Read):</strong> Used to allow you to upload existing videos or images from your device for assignments or your profile photo.</li>
        <li><strong>Photo Library (Write):</strong> Used to save recorded videos to your device if you choose to keep a local copy.</li>
      </ul>
      <p className="mb-4">You can revoke these permissions at any time through your device Settings. The app will continue to function for viewing content, but you will not be able to record or upload new submissions.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Storage &amp; Security</h2>
      <p className="mb-4">Your data is stored securely on Amazon Web Services (AWS) infrastructure in the United States:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Video files are stored in encrypted Amazon S3 buckets with server-side encryption (AES-256)</li>
        <li>User data is stored in Amazon DynamoDB with encryption at rest</li>
        <li>All data in transit is protected with TLS 1.2+ encryption</li>
        <li>Authentication tokens are signed with industry-standard JWT</li>
        <li>Passwords are hashed using bcrypt with salt rounds</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Sharing</h2>
      <p className="mb-4">We do <strong>not</strong> sell, rent, or share your personal information with third parties for advertising or marketing purposes. Your data is shared only with:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Your instructors (grades, submissions, feedback)</li>
        <li>Your classmates (video submissions visible within assigned peer review activities)</li>
        <li>School administrators as required for academic administration</li>
        <li>AWS infrastructure services (as our hosting provider, under data processing agreements)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Third-Party SDKs &amp; Tracking</h2>
      <p className="mb-4">ClassCast does <strong>not</strong> include any:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Advertising frameworks or ad tracking SDKs</li>
        <li>Analytics or behavior tracking tools (no Google Analytics, Firebase Analytics, etc.)</li>
        <li>Social media tracking pixels</li>
        <li>Cross-app tracking identifiers</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Children&apos;s Privacy (COPPA &amp; FERPA)</h2>
      <p className="mb-4">ClassCast is designed for use in educational settings by students ages 14 and older (high school and college). Regarding student privacy:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Student accounts are provisioned by school administrators or created with educational institution oversight</li>
        <li>We comply with the Family Educational Rights and Privacy Act (FERPA) regarding student education records</li>
        <li>We comply with the Children&apos;s Online Privacy Protection Act (COPPA) — we do not knowingly collect information from children under 13</li>
        <li>We do not serve targeted advertising to any users</li>
        <li>We do not build user profiles for commercial purposes</li>
        <li>Student data is used exclusively for educational purposes within the ClassCast platform</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Account Deletion</h2>
      <p className="mb-4">You can delete your account at any time from within the app:</p>
      <ol className="list-decimal pl-6 mb-4 space-y-1">
        <li>Navigate to Settings from your profile</li>
        <li>Scroll to the &quot;Danger Zone&quot; section</li>
        <li>Tap &quot;Delete My Account&quot;</li>
        <li>Confirm by typing DELETE</li>
      </ol>
      <p className="mb-4">Account deletion is <strong>permanent and irreversible</strong>. When you delete your account:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Your profile information is immediately removed</li>
        <li>Your video submissions are deleted</li>
        <li>Your course enrollments and grades are removed</li>
        <li>Any comments or ratings you&apos;ve made are disassociated from your identity</li>
      </ul>
      <p className="mb-4">You may also request account deletion by contacting your school administrator or emailing support@class-cast.com.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Data Retention</h2>
      <p className="mb-4">We retain your data only for as long as your account is active or as needed to provide the educational service. After account deletion, data is removed within 30 days from all systems including backups.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Your Rights</h2>
      <p className="mb-4">You have the right to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Access your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and data</li>
        <li>Export your data (by contacting support)</li>
        <li>Opt out of non-essential communications</li>
      </ul>
      <p className="mb-4">Exercise these rights by contacting your school administrator or emailing support@class-cast.com.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">11. Changes to This Policy</h2>
      <p className="mb-4">We may update this privacy policy to reflect changes in our practices or for legal reasons. We will notify users of material changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">12. Contact</h2>
      <p className="mb-4">For questions about this privacy policy or our data practices, contact:<br />ClassCast.ai<br />Email: support@class-cast.com</p>
    </div>
  );
}
