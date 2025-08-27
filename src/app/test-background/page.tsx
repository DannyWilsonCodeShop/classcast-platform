export default function TestBackgroundPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#003366] mb-8 text-center">
          Background Image Test
        </h1>
        
        <div className="space-y-8">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-[#003366]/20">
            <h2 className="text-2xl font-bold text-[#003366] mb-4">Test Card 1</h2>
            <p className="text-gray-700">
              This card has a semi-transparent white background. You should be able to see the background image through it.
            </p>
          </div>
          
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-[#D4AF37]/20">
            <h2 className="text-2xl font-bold text-[#003366] mb-4">Test Card 2</h2>
            <p className="text-gray-700">
              This card has a very transparent white background. The background image should be clearly visible.
            </p>
          </div>
          
          <div className="bg-transparent rounded-2xl p-8 border-2 border-[#003366]">
            <h2 className="text-2xl font-bold text-[#003366] mb-4">Test Card 3</h2>
            <p className="text-gray-700">
              This card has no background at all. The background image should be fully visible.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            If you can see the background image through these cards, the CSS is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
}
