import { useState, useEffect, useRef } from 'react';
import { Play, Mic, Headphones, Users, ChevronRight, Wand2, Volume2, Zap, Award, ArrowDown } from 'lucide-react';
import { Link } from "react-router-dom";

const PodcastLandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const featureItems = [
    {
      icon: <Mic className="h-10 w-10 text-blue-700" />,
      title: "Professional Recording",
      description: "Studio-quality recording with noise cancellation and audio enhancement for crystal clear sound.",
      color: "blue",
      bgGradient: "from-blue-200 to-blue-100"
    },
    {
      icon: <Users className="h-10 w-10 text-indigo-700" />,
      title: "Remote Collaboration",
      description: "Connect with guests and co-hosts from anywhere in the world with high-quality video conferencing.",
      color: "indigo",
      bgGradient: "from-indigo-200 to-indigo-100"
    },
    {
      icon: <Wand2 className="h-10 w-10 text-violet-700" />,
      title: "AI Guest",
      description: "Create AI-powered guests for your podcast. Perfect for interviews, discussions, or adding variety to solo shows.",
      color: "violet",
      bgGradient: "from-violet-200 to-violet-100"
    },
    {
      icon: <Volume2 className="h-10 w-10 text-sky-700" />,
      title: "Smart Editing",
      description: "AI-powered editing tools to remove filler words, enhance sound quality, and create professional results effortlessly.",
      color: "sky",
      bgGradient: "from-sky-200 to-sky-100"
    },
    {
      icon: <Zap className="h-10 w-10 text-blue-700" />,
      title: "One-Click Publishing",
      description: "Publish your episodes to all major podcast platforms with a single click. Reach your audience everywhere.",
      color: "blue",
      bgGradient: "from-blue-200 to-blue-100"
    },
    {
      icon: <Award className="h-10 w-10 text-indigo-700" />,
      title: "Growth Analytics",
      description: "Comprehensive analytics to track your audience growth, engagement, and help you optimize your content.",
      color: "indigo",
      bgGradient: "from-indigo-200 to-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100 mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-indigo-100 mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-blue-200 mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white/90 backdrop-blur-md shadow-sm' : ''}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src='/logo_trans.png' alt="Logo" className={`h-10 w-10 transition-transform duration-500 ${scrollY > 20 ? 'scale-90' : 'scale-100'}`} />
            <span className={`text-xl font-bold transition-all duration-500 ${scrollY > 20 ? 'text-lg' : ''}`} style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
              Spinning Wheel
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className={`px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${scrollY > 20 ? 'scale-95' : 'scale-100'}`}>
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="container mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-10 mb-12 lg:mb-0 relative">
            <div className="absolute -left-10 -top-10 w-20 h-20 rounded-full bg-blue-100 opacity-60 blur-md"></div>
            <h1 className={`text-5xl md:text-6xl font-extrabold leading-tight mb-6 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700`}
                style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
              Bring Your Voice to the World
            </h1>
            <p className={`text-xl text-gray-600 mb-8 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700 delay-100`}>
              Record, edit, and publish professional podcasts with AI-powered tools—no experience required.
            </p>
            <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-700 delay-200`}>
              <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-medium shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center">
                <span>Get Started Free</span>
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <button onClick={scrollToFeatures} className="px-8 py-4 border-2 border-blue-600 text-blue-700 rounded-full font-medium hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center">
                <span>Discover Features</span>
                <ArrowDown className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className={`relative h-96 md:h-[500px] w-full transform ${isLoaded ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-20 opacity-0 rotate-12'} transition-all duration-1000 delay-300`}>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-500/20 blur-lg"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-xl opacity-10"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 md:w-76 md:h-76">
                <div className="w-full h-full rounded-full border-4 border-blue-600/30 border-dashed animate-spin" style={{ animationDuration: '15s' }}></div>
                <div className="absolute inset-4 rounded-full border-4 border-indigo-500/40 border-dashed animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}></div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center z-10 animate-pulse-slow">
                <div className="absolute inset-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100"></div>
                <Mic className="h-12 w-12 text-blue-700 relative z-10" />
              </div>
              <div className="absolute top-[15%] left-[20%] w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDuration: '6s', animationDelay: '0.5s' }}>
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-50 to-blue-100"></div>
                <Headphones className="h-8 w-8 text-blue-600 relative z-10" />
              </div>
              <div className="absolute bottom-[20%] right-[15%] w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100"></div>
                <Users className="h-8 w-8 text-indigo-600 relative z-10" />
              </div>
              <div className="absolute top-[30%] right-[15%] w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDuration: '7s', animationDelay: '1.5s' }}>
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-50 to-violet-100"></div>
                <Play className="h-8 w-8 text-violet-600 relative z-10" />
              </div>
              <div className="absolute bottom-[30%] left-[15%] w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }}>
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-sky-50 to-sky-100"></div>
                <Wand2 className="h-8 w-8 text-sky-600 relative z-10" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/40 animate-ping-slow" style={{ width: `${(i+2) * 50}px`, height: `${(i+2) * 50}px`, animationDuration: `${3 + i * 0.5}s`, animationDelay: `${i * 0.2}s`, opacity: 0.3 - (i * 0.05) }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Animated Wave Divider */}
      <div className="relative h-24 bg-white">
        <svg className="absolute top-0 w-full h-24 text-blue-50" preserveAspectRatio="none" viewBox="0 0 1440 74">
          <path fill="currentColor" d="M456.464 0.0433865C277.158 -1.70575 0 50.0141 0 50.0141V74H1440V50.0141C1440 50.0141 1320.4 31.1925 1243.09 27.0276C1099.33 19.2816 1019.08 53.1981 875.138 50.0141C710.527 46.3727 621.108 1.64949 456.464 0.0433865Z"></path>
        </svg>
      </div>

      {/* Feature Highlights */}
      <section ref={featuresRef} id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-6" style={{ color: '#0942AC' }}>
            Everything You Need for Podcast Success
          </h2>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Tools to create, publish, and grow your podcast—all in one place.
          </p>
          <div className="max-w-4xl mx-auto mb-12 overflow-x-auto hide-scrollbar">
            <div className="bg-gray-100 p-2 rounded-full inline-flex min-w-max">
              {featureItems.map((feature, index) => (
                <button key={index} onClick={() => setActiveFeature(index)} className={`px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap text-sm font-medium ${activeFeature === index ? `bg-${feature.color}-600 text-white` : 'text-gray-600 hover:bg-gray-200'}`}>
                  {feature.title}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-5xl mx-auto mb-16">
            <div className={`bg-gradient-to-br ${featureItems[activeFeature].bgGradient} rounded-3xl p-8 shadow-lg transition-all duration-500`}>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0 w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center animate-pulse-slow">
                  {featureItems[activeFeature].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{featureItems[activeFeature].title}</h3>
                  <p className="text-lg text-gray-700 mb-6">{featureItems[activeFeature].description}</p>
                  <Link to="/register" className="inline-flex items-center text-blue-700 font-medium hover:underline">
                    <span>Try it now</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureItems.map((feature, index) => (
              <div key={index} className={`rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br ${feature.bgGradient}`} onClick={() => setActiveFeature(index)}>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Mic className="h-64 w-64 text-white opacity-10 animate-pulse-slow" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Podcast Journey?</h2>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/login" className="px-8 py-4 bg-white text-blue-700 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
                Login
              </Link>
              <Link to="/register" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <img src="./logo_trans.png" alt="Logo" className="w-10 h-10" />
              <span className="text-xl font-bold" style={{ fontFamily: 'Posey Regular, sans-serif', color: '#0942AC' }}>
                Spinning Wheel
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a href="mailto:arumynameis@gmail.com" className="text-gray-600 hover:text-blue-700 transition-colors font-medium">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Spinning Wheel. All rights reserved.</p>
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
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-ping-slow { animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PodcastLandingPage;