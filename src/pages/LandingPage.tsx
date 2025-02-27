import { useState, useEffect } from 'react';
import { Play, Mic, Headphones, Users, ChevronRight } from 'lucide-react';
import { Link } from "react-router-dom";

const PodcastLandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* Logo Placeholder - Replace with actual logo */}
          <img src='/logo_trans.png' alt="Logo" className="h-10 w-10" />
          <span className="text-xl font-bold" style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
            Spinning Wheel
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/login" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-medium hover:shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0">
            Login
          </Link>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-12 pb-24">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-10 mb-12 lg:mb-0">
            <h1 className={`text-5xl md:text-6xl font-extrabold leading-tight mb-6 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700`} 
                style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
              Create Amazing Podcasts with Ease
            </h1>
            <p className={`text-xl text-gray-600 mb-8 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700 delay-100`}>
              Your virtual studio for recording, editing, and publishing professional podcasts. No experience needed.
            </p>
            <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700 delay-200`}>
              <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-medium hover:shadow-xl transition transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center">
                <span>Sign Up</span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            {/* 3D Podcast Studio Visualization */}
            <div className={`relative h-80 md:h-96 w-full transform ${isLoaded ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-20 opacity-0 rotate-12'} transition-all duration-1000 delay-300`}>
              {/* Main Circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-xl opacity-20 animate-pulse" 
                  style={{ animationDuration: '3s' }}></div>
              
              {/* Spinning Wheel */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-72 md:h-72 rounded-full border-4 border-blue-600 border-dashed animate-spin" 
                  style={{ animationDuration: '15s' }}></div>
              
              {/* Center Mic */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center z-10">
                <Mic className="h-10 w-10 text-blue-700" />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" 
                  style={{ animationDuration: '6s', animationDelay: '0.5s' }}>
                <Headphones className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" 
                  style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="absolute top-1/2 right-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" 
                  style={{ animationDuration: '7s', animationDelay: '1.5s' }}>
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              
              {/* Sound Waves */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-48 md:h-48 rounded-full border border-blue-300 animate-ping opacity-30"
                  style={{ animationDuration: '2s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full border border-blue-400 animate-ping opacity-30"
                  style={{ animationDuration: '2s', animationDelay: '0.3s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full border border-blue-500 animate-ping opacity-30"
                  style={{ animationDuration: '2s', animationDelay: '0.6s' }}></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#0942AC' }}>
            Everything You Need for Podcast Success
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className={`bg-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Mic className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Professional Recording</h3>
              <p className="text-gray-600">
                Studio-quality recording with noise cancellation and audio enhancement for crystal clear sound.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className={`bg-indigo-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-indigo-700" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Remote Collaboration</h3>
              <p className="text-gray-600">
                Connect with guests and co-hosts from anywhere in the world with high-quality video conferencing.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className={`bg-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Headphones className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">AI Guest</h3>
              <p className="text-gray-600">
                AI-powered editing tools to remove filler words, enhance sound quality, and create professional results.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-pattern-dots"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Create Your First Episode?</h2>
            <p className="text-blue-100 text-xl mb-10">
              Join thousands of podcasters who are sharing their voice with the world.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/login" className="px-8 py-4 bg-white text-blue-700 rounded-full font-bold hover:shadow-xl hover:bg-blue-50 transition transform hover:-translate-y-1 active:translate-y-0">
                Login
              </Link>
              <Link href="/register" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition transform hover:-translate-y-1 active:translate-y-0">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              {/* Replace Mic Icon with Logo */}
              <img src="./logo_trans.png" alt="Logo" className="w-8 h-8" />
              <span className="text-lg font-bold" style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
                Spinning Wheel
              </span>
            </div>
            
            <div className="flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-blue-700 transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-blue-700 transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-blue-700 transition-colors">Help</a>
              <a href="#" className="text-gray-600 hover:text-blue-700 transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Spinning Wheel. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-float {
          animation-name: float;
          animation-duration: 3s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        
        .bg-pattern-dots {
          background-image: radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default PodcastLandingPage;
