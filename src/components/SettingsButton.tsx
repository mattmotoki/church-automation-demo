'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface SettingsButtonProps {}

export default function SettingsButton({}: SettingsButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        title="Settings"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <Link
            href="/slides"
            onClick={handleLinkClick}
            className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 transition-colors block"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" viewBox="0 0 512 512" stroke="currentColor">
                <rect x="32" y="64" width="448" height="320" rx="32" ry="32" strokeLinejoin="round" strokeWidth="32"/>
                <polygon points="304 448 296 384 216 384 208 448 304 448" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
                <line x1="368" y1="448" x2="144" y2="448" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
                <path d="M32,304v48a32.09,32.09,0,0,0,32,32H448a32.09,32.09,0,0,0,32-32V304Zm224,64a16,16,0,1,1,16-16A16,16,0,0,1,256,368Z" fill="currentColor"/>
              </svg>
              Generate Slides
            </div>
          </Link>
          
          {/* Placeholder for future settings */}
          <hr className="my-1 border-gray-200" />
          <div className="px-4 py-2 text-xs text-gray-500">
            More settings coming soon...
          </div>
        </div>
      )}
    </div>
  );
}