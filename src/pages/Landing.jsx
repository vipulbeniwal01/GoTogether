import { Link } from 'react-router-dom';
import arrowRight from '../assets/arrow-right.svg'; 
import carImage from '../assets/car.svg';
import { FaCar, FaShieldAlt, FaUserFriends, FaMoneyBillWave, FaLeaf, FaHandshake } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { FaMapMarkedAlt, FaCarSide, FaStar, FaArrowRight } from 'react-icons/fa';

export const Landing = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const features = [
    {
      icon: <FaCar className="text-4xl text-[#4c48ec]" />,
      title: "Share Rides",
      description: "Find travel companions and split costs on your journeys. Make your trips more affordable and enjoyable."
    },
    {
      icon: <FaShieldAlt className="text-4xl text-[#4c48ec]" />,
      title: "Safe & Secure",
      description: "Travel with confidence using our verified user system and secure payment processing."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Community Driven",
      description: "Join a friendly community of travelers. Rate and review your experience after each ride."
    },
    {
      icon: <FaMoneyBillWave className="text-4xl text-[#4c48ec]" />,
      title: "Cost Effective",
      description: "Save money on your travels by sharing expenses with fellow travelers."
    },
    {
      icon: <FaLeaf className="text-4xl text-[#4c48ec]" />,
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint by sharing rides and contributing to a greener environment."
    },
    {
      icon: <FaHandshake className="text-4xl text-[#4c48ec]" />,
      title: "Reliable Partners",
      description: "Connect with verified and trustworthy travel companions for a worry-free journey."
    }
  ];

  const getVisibleCards = () => {
    const wrappedFeatures = [...features, ...features, ...features];
    const startIndex = currentIndex;
    return wrappedFeatures.slice(startIndex, startIndex + 5);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const howItWorks = [
    {
      icon: <FaMapMarkedAlt className="text-4xl text-[#4c48ec]" />,
      title: "Plan Your Journey",
      description: "Enter your destination and travel dates to find available rides or post your own journey."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Connect with Travelers",
      description: "Browse through profiles, check reviews, and connect with compatible travel companions."
    },
    {
      icon: <FaCarSide className="text-4xl text-[#4c48ec]" />,
      title: "Share the Ride",
      description: "Confirm your booking, meet your travel buddies, and split the costs fairly."
    },
    {
      icon: <FaStar className="text-4xl text-[#4c48ec]" />,
      title: "Rate & Review",
      description: "After your journey, rate your experience and help build a trusted community."
    }
  ];

  return (
    <section className="min-h-screen pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-20 bg-[radial-gradient(ellipse_200%_100%_at_bottom_center,#4c48ec,#FFFFFF_30%)] relative overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-20 max-w-10xl justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 relative">
          <div className='w-full lg:w-[500px] z-10 relative text-center lg:text-left'>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#4c48ec] text-transparent bg-clip-text mt-4 sm:mt-6">
              Welcome to GoTogether
            </h1>
            <p className="text-lg sm:text-xl text-[#010D3E] tracking-tight mt-4 sm:mt-6 max-w-xl mx-auto lg:mx-0">
              Share rides, reduce costs, and make new connections. Join our community of travelers making transportation more sustainable and social.
            </p>
            <div className="flex sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center mt-6 sm:mt-8">
              <Link  
                to="/register"
                className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center tracking-tight hover:bg-opacity-90 transition-all">
                  Get Started
              </Link>
              <Link 
                to="/login"
                className="w-full sm:w-auto bg-transparent text-black px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center tracking-tight gap-1 hover:bg-black/5 transition-all">
                <span>Sign In</span>
                <img src={arrowRight} alt="arrow" className="h-5 w-5"/>
              </Link>
            </div>
          </div>
          <div className="w-full sm:w-[80%] lg:w-1/2 mx-auto mt-12 sm:mt-16 lg:mt-0 relative flex justify-center">
            <img 
              src={carImage} 
              alt="car image" 
              className="w-full h-auto object-contain max-w-[600px] lg:max-w-[700px]"
            />
          </div>
        </div>
      </div> 

      {/* Features Section */}
      <div className="mt-24 lg:mt-32 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
          Why Choose GoTogether?
        </h2>
        <div className="max-w-7xl mx-auto overflow-hidden">
          <div 
            className="flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / features.length)}%)` }}
          >
            {features.concat(features).map((feature, index) => (
              <div 
                key={index} 
                className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-4"
              >
                <div className="p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#4c48ec]/10 p-4 rounded-full mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-[#010D3E]">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* How It Works Section */}
      <div className="mt-24 lg:mt-32 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
          How GoTogether Works
        </h2>
        <p className="text-center text-lg text-[#010D3E] mb-12 max-w-2xl mx-auto">
          Get started with GoTogether in four simple steps
        </p>
        <div className="max-w-7xl mx-auto relative">
          <div className="sm:hidden absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#4c48ec]/20 transform -translate-x-1/2" />
          
          {howItWorks.map((step, index) => (
            <div key={index} 
                 className={`flex flex-col md:flex-row gap-8 items-center mb-24 relative
                            ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'} 
                             relative z-10`}>
                <div className="flex items-start gap-6">
                  <div className="bg-[#4c48ec]/10 p-4 rounded-full shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-[#010D3E]">{step.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative z-20 hidden md:block">
                <div className="w-12 h-12 rounded-full bg-[#4c48ec] text-white flex items-center justify-center
                              font-bold text-xl">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </section>
  );
}

export default Landing;