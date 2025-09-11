'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface BackgroundData {
  id: string;
  display_name: string;
  path: string;
  type: string;
}

interface BackgroundPickerProps {
  label: string;
  selectedBackground: BackgroundData | null;
  selectedFile: File | null;
  onBackgroundSelect: (background: BackgroundData | null) => void;
  onFileSelect: (file: File | null) => void;
  className?: string;
}

export default function BackgroundPicker({
  label,
  selectedBackground,
  selectedFile,
  onBackgroundSelect,
  onFileSelect,
  className = ''
}: BackgroundPickerProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundData[]>([]);

  // Create object URL for uploaded file
  const uploadedFileUrl = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (uploadedFileUrl) {
        URL.revokeObjectURL(uploadedFileUrl);
      }
    };
  }, [uploadedFileUrl]);

  // Load available backgrounds
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const response = await fetch('/data/backgrounds.json');
        if (response.ok) {
          const backgrounds = await response.json();
          setAvailableBackgrounds(backgrounds);
          
          // Auto-select first background if none selected
          if (!selectedBackground && !selectedFile && backgrounds.length > 0) {
            // Select different defaults based on label
            // Select different defaults based on label
            if (label === 'Base') {
              // Base uses heavenly-light
              onBackgroundSelect(backgrounds.find((bg: BackgroundData) => bg.id === 'heavenly-light') || backgrounds[0]);
            } else if (label.includes('Hymn 1')) {
              // Hymn 1 uses green-palms
              onBackgroundSelect(backgrounds.find((bg: BackgroundData) => bg.id === 'green-palms') || backgrounds[0]);
            } else if (label.includes('Hymn 2')) {
              // Hymn 2 uses ocean-sunrise
              onBackgroundSelect(backgrounds.find((bg: BackgroundData) => bg.id === 'ocean-sunrise') || backgrounds[0]);
            } else if (label.includes('Hymn 3')) {
              // Hymn 3 uses mountain-cross
              onBackgroundSelect(backgrounds.find((bg: BackgroundData) => bg.id === 'mountain-cross') || backgrounds[0]);
            } else {
              // Default fallback
              onBackgroundSelect(backgrounds.find((bg: BackgroundData) => bg.id === 'heavenly-light') || backgrounds[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading backgrounds:', err);
      }
    };
    
    loadBackgrounds();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onBackgroundSelect(null); // Clear gallery selection
    }
  };

  const handleGallerySelect = (background: BackgroundData) => {
    onBackgroundSelect(background);
    onFileSelect(null); // Clear file selection
    setShowSelector(false);
  };

  const clearSelection = () => {
    onBackgroundSelect(null);
    onFileSelect(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">{label}</h4>
      
      {/* Selection Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSelector(true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Gallery
        </button>
        <button
          onClick={() => document.getElementById(`file-input-${label}`)?.click()}
          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </button>
      </div>

      <input
        id={`file-input-${label}`}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Current Selection Display */}
      {(selectedFile || selectedBackground) ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-blue-900">Selected:</p>
              <p className="text-sm text-blue-700">
                {selectedFile ? selectedFile.name : selectedBackground?.display_name}
              </p>
            </div>
            <button
              onClick={clearSelection}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          
          {/* Preview - 16:9 aspect ratio, smaller size */}
          <div className="relative w-full rounded-lg overflow-hidden border border-blue-300" style={{ paddingBottom: '33.75%' }}>
            {uploadedFileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={uploadedFileUrl} 
                alt={selectedFile?.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : selectedBackground ? (
              <Image 
                src={selectedBackground.path} 
                alt={selectedBackground.display_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Default Background</p>
              <p className="text-sm text-gray-500">Mountain Cross Sunset will be used</p>
            </div>
          </div>
        </div>
      )}

      {/* Background Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Choose Background for {label}</h3>
                <button
                  onClick={() => setShowSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {availableBackgrounds.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableBackgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedBackground?.id === bg.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleGallerySelect(bg)}
                    >
                      <div className="relative w-full h-24">
                        <Image 
                          src={bg.path} 
                          alt={bg.display_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {bg.display_name}
                        </p>
                        <p className="text-xs text-gray-500">{bg.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No background images available.
                </p>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowSelector(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}