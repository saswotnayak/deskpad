import React, { useState, useEffect, TouchEvent } from 'react';
import './TabSlider.css';

interface TabSliderProps {
  pages: React.ReactNode[];
}

export function TabSlider({ pages }: TabSliderProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const pagesCount = pages.length;

  // Minimum swipe distance in px to register a transition
  const minSwipeDistance = 60;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab < pagesCount - 1) {
      setActiveTab(prev => prev + 1);
    } else if (isRightSwipe && activeTab > 0) {
      setActiveTab(prev => prev - 1);
    }
  };

  // Keyboard navigation for local debugging & testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight' && activeTab < pagesCount - 1) {
        setActiveTab(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && activeTab > 0) {
        setActiveTab(prev => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, pagesCount]);

  return (
    <div 
      className="tab-slider-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div 
        className="tab-slider-track" 
        style={{ 
          width: `${pagesCount * 100}%`,
          transform: `translateX(-${activeTab * (100 / pagesCount)}%)` 
        }}
      >
        {pages.map((page, idx) => (
          <div 
            key={idx} 
            className="tab-slider-page" 
            style={{ width: `${100 / pagesCount}%` }}
            aria-hidden={activeTab !== idx}
          >
            {page}
          </div>
        ))}
      </div>

      {/* Android/iOS Home-Screen Style Pagination Dot Indicators */}
      <div className="tab-slider-indicators">
        {pages.map((_, idx) => (
          <button 
            key={idx}
            className={`tab-slider-dot ${activeTab === idx ? 'active' : ''}`}
            onClick={() => setActiveTab(idx)}
            aria-label={`Go to tab page ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
