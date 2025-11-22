export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-lime-400 p-4 md:p-8">
      {/* Main grid container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto">
        
        {/* Large purple card - LUT branding */}
        <div className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-orange-600 to-purple-900 rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
          <h1 className="text-white text-7xl font-bold">LUT</h1>
        </div>

        {/* Smart home illustration card */}
        <div className="bg-gray-100 rounded-3xl p-8 flex items-center justify-center min-h-[200px]">
          <p className="text-gray-400 text-sm">Smart Home Project</p>
        </div>

        {/* WINK storefront card */}
        <div className="bg-gray-800 rounded-3xl overflow-hidden min-h-[200px]">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white text-sm">WINK Store</p>
          </div>
        </div>

        {/* Team photo card */}
        <div className="md:col-span-1 bg-gray-300 rounded-3xl overflow-hidden min-h-[250px]">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600 text-sm">Team Photo</p>
          </div>
        </div>

        {/* Barbershop card */}
        <div className="bg-orange-200 rounded-3xl overflow-hidden min-h-[250px]">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600 text-sm">Barbershop Project</p>
          </div>
        </div>

        {/* Beer cans (Vimpel) card */}
        <div className="bg-black rounded-3xl overflow-hidden min-h-[250px]">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white text-sm">Vimpel Beer</p>
          </div>
        </div>

        {/* ABOUT button */}
        <div className="bg-gradient-to-r from-red-600 to-purple-900 rounded-3xl p-8 flex items-center justify-center min-h-[120px] cursor-pointer hover:scale-105 transition-transform">
          <h2 className="text-white text-4xl font-bold">ABOUT</h2>
        </div>

        {/* Instagram icon */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-3xl p-8 flex items-center justify-center min-h-[120px] cursor-pointer hover:scale-105 transition-transform">
          <span className="text-white text-5xl">📷</span>
        </div>

        {/* CONTACT button */}
        <div className="bg-orange-200 rounded-3xl p-8 flex items-center justify-center min-h-[120px] cursor-pointer hover:scale-105 transition-transform">
          <h2 className="text-gray-800 text-4xl font-bold">CONTACT</h2>
        </div>

        {/* CASES button */}
        <div className="bg-gradient-to-br from-orange-400 to-red-400 rounded-3xl p-8 flex items-center justify-center min-h-[120px] cursor-pointer hover:scale-105 transition-transform">
          <h2 className="text-white text-4xl font-bold">CASES</h2>
        </div>

        {/* LinkedIn icon */}
        <div className="bg-blue-600 rounded-3xl p-8 flex items-center justify-center min-h-[120px] cursor-pointer hover:scale-105 transition-transform">
          <span className="text-white text-5xl">in</span>
        </div>

      </div>
    </main>
  );
}
