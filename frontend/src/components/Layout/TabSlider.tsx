import React, { useState, useEffect, TouchEvent } from 'react';
import './TabSlider.css';

interface TabSliderProps {
  page1: React.ReactNode;
  page2: React.ReactNode;
}

export function TabSlider({ page1, page2 }: TabSliderProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

    if (isLeftSwipe && activeTab === 0) {
      setActiveTab(1);
    } else if (isRightSwipe && activeTab === 1) {
      setActiveTab(0);
    }
  };

  // Keyboard navigation for local debugging & testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field (though there shouldn't be any active text inputs)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight' && activeTab === 0) {
        setActiveTab(1);
      } else if (e.key === 'ArrowLeft' && activeTab === 1) {
        setActiveTab(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div 
      className="tab-slider-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div 
        className="tab-slider-track" 
        style={{ transform: `translateX(-${activeTab * 50}%)` }}
      >
        <div className="tab-slider-page" aria-hidden={activeTab !== 0}>
          {page1}
        </div>
        <div className="tab-slider-page" aria-hidden={activeTab !== 1}>
          {page2}
        </div>
      </div>

      {/* Android/iOS Home-Screen Style Pagination Dot Indicators */}
      <div className="tab-slider-indicators">
        <button 
          className={`tab-slider-dot ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
          aria-label="Go to Clock and Calendar"
        />
        <button 
          className={`tab-slider-dot ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
          aria-label="Go to To-Do Tasks"
        />
      </div>
    </div>
  );
}
