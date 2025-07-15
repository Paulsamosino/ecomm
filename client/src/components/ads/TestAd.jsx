import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetActiveAds, apiTrackAdClick, apiTrackAdImpression } from '@/api/admin';

const TestAd = ({ type = 'banner', className = '', autoRotateInterval = 10000 }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchActiveAds();
  }, [type]);

  const fetchActiveAds = async () => {
    try {
      const data = await apiGetActiveAds(type);
      setAds(data);
      setLoading(false);
      
      // Track impression for the first ad
      if (data.length > 0) {
        await apiTrackAdImpression(data[0]._id || data[0].id);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setLoading(false);
    }
  };

  const handleAdClick = async (ad) => {
    try {
      // Track the click
      await apiTrackAdClick(ad._id || ad.id);
      
      // Open the ad URL in new tab
      if (ad.url) {
        const formattedUrl = ad.url.startsWith('http') ? ad.url : `https://${ad.url}`;
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Still open the link even if tracking fails
      if (ad.url) {
        const formattedUrl = ad.url.startsWith('http') ? ad.url : `https://${ad.url}`;
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const nextAd = async () => {
    const newIndex = (currentAdIndex + 1) % ads.length;
    setCurrentAdIndex(newIndex);
    
    // Track impression for the new ad
    try {
      await apiTrackAdImpression(ads[newIndex]._id || ads[newIndex].id);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  const prevAd = async () => {
    const newIndex = currentAdIndex === 0 ? ads.length - 1 : currentAdIndex - 1;
    setCurrentAdIndex(newIndex);
    
    // Track impression for the new ad
    try {
      await apiTrackAdImpression(ads[newIndex]._id || ads[newIndex].id);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  const goToAd = async (index) => {
    setCurrentAdIndex(index);
    
    // Track impression for the new ad
    try {
      await apiTrackAdImpression(ads[index]._id || ads[index].id);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Auto-rotate ads with configurable interval
  useEffect(() => {
    if (ads.length > 1 && !isPaused) {
      const interval = setInterval(nextAd, autoRotateInterval);
      return () => clearInterval(interval);
    }
  }, [ads.length, currentAdIndex, isPaused, autoRotateInterval]);

  if (!isVisible || loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];

  // Banner Ad Layout
  if (type === 'banner') {
    return (
      <div 
        className={`relative bg-gradient-to-r ${currentAd.backgroundColor || 'from-orange-500 to-orange-600'} rounded-xl overflow-hidden shadow-lg border border-orange-200 ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-black bg-opacity-20 hover:bg-opacity-40 rounded-full p-1.5 transition-all"
        >
          <X className="h-4 w-4 text-white" />
        </button>
        
        {/* Navigation controls for multiple ads */}
        {ads.length > 1 && (
          <>
            <button
              onClick={prevAd}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2.5 transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={nextAd}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2.5 transition-all"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
            
            {/* Ad indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAdIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    index === currentAdIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        <div 
          className="flex items-center p-6 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleAdClick(currentAd)}
        >
          {currentAd.image && (
            <div className="flex-shrink-0 mr-6">
              <img
                src={currentAd.image}
                alt={currentAd.title}
                className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-md"
              />
            </div>
          )}
          
          <div className="flex-grow text-white">
            <h3 className="text-xl font-bold mb-2">{currentAd.title}</h3>
            <p className="text-orange-100 mb-3 line-clamp-2">{currentAd.description}</p>
            {currentAd.price && (
              <p className="text-2xl font-bold text-yellow-300">₱{parseFloat(currentAd.price).toFixed(2)}</p>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <div className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-md">
              {currentAd.ctaText || 'Shop Now'}
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Square Ad Layout
  if (type === 'square') {
    return (
      <div 
        className={`relative bg-white border border-orange-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-all"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        
        <div 
          className="cursor-pointer"
          onClick={() => handleAdClick(currentAd)}
        >
          {currentAd.image && (
            <div className="relative aspect-square overflow-hidden bg-orange-50">
              <img
                src={currentAd.image}
                alt={currentAd.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              
              {/* Navigation controls positioned on the image */}
              {ads.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevAd();
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextAd();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all"
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                  
                  {/* Ad indicators positioned on the image */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                    {ads.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToAd(index);
                        }}
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                          index === currentAdIndex ? 'bg-orange-500' : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{currentAd.title}</h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{currentAd.description}</p>
            {currentAd.price && (
              <p className="text-lg font-bold text-orange-600 mb-3">₱{parseFloat(currentAd.price).toFixed(2)}</p>
            )}
            <button className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-medium">
              {currentAd.ctaText || 'Shop Now'}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Small/Sidebar Ad Layout
  if (type === 'small') {
    return (
      <div 
        className={`relative bg-white border border-orange-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-all"
        >
          <X className="h-3 w-3 text-gray-600" />
        </button>
        
        {/* Navigation controls for multiple ads */}
        {ads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  index === currentAdIndex ? 'bg-orange-600' : 'bg-gray-400 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
        
        <div 
          className="flex items-center p-3 cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={() => handleAdClick(currentAd)}
        >
          {currentAd.image && (
            <div className="flex-shrink-0 mr-3">
              <img
                src={currentAd.image}
                alt={currentAd.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-grow min-w-0">
            <h5 className="font-medium text-sm text-gray-900 truncate">{currentAd.title}</h5>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{currentAd.description}</p>
            {currentAd.price && (
              <p className="text-sm font-semibold text-orange-600 mt-1">₱{parseFloat(currentAd.price).toFixed(2)}</p>
            )}
          </div>
          
          <ExternalLink className="h-4 w-4 text-orange-400 flex-shrink-0 ml-2" />
        </div>
      </div>
    );
  }

  return null;
};

export default TestAd;
