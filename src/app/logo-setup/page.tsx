'use client';

import LogoUpload from '@/components/LogoUpload';

export default function LogoSetupPage() {
  const handleLogoUpload = (file: File) => {
    // Here you would typically upload the file to your server/storage
    console.log('Logo uploaded:', file);
    
    // For now, we'll just show a success message
    alert('Logo uploaded successfully! You can now use it in your navigation.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#003366] mb-4">
              Upload Your Logo
            </h1>
            <p className="text-lg font-normal text-gray-600">
              Customize your ClassCast platform with your own logo
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <LogoUpload onLogoUpload={handleLogoUpload} />
            
            <div className="mt-8 p-6 bg-gray-50/90 backdrop-blur-sm rounded-xl">
              <h3 className="text-lg font-bold text-[#003366] mb-3">
                How to use your logo:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm font-normal text-gray-700">
                <li>Upload your logo image above (PNG, JPG, or SVG recommended)</li>
                <li>Save the image to your project's <code className="bg-gray-200 px-1 rounded">public/images/</code> folder</li>
                <li>Name it <code className="bg-gray-200 px-1 rounded">logo.png</code> (or your preferred name)</li>
                <li>Update the Navigation component to use your logo</li>
              </ol>
              
              <div className="mt-4 p-4 bg-[#003366]/10 border border-[#003366]/20 rounded-lg">
                <p className="text-sm font-normal text-[#003366]">
                  <strong>Note:</strong> After uploading, you'll need to manually place the image file in your project's public folder and update the Navigation component to reference it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
