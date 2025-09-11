'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface BackgroundData {
  id: string;
  display_name: string;
  path: string;
  type: string;
}

// Helper function to convert image to base64
async function fetchImageAsBase64(imagePath: string): Promise<string> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function BenedictionTab() {
  const [leadPastor, setLeadPastor] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundData | null>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundData[]>([]);

  // Create object URL for uploaded image
  const uploadedImageUrl = useMemo(() => {
    if (backgroundImage) {
      return URL.createObjectURL(backgroundImage);
    }
    return null;
  }, [backgroundImage]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  // Load available backgrounds
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const response = await fetch('/data/backgrounds.json');
        if (response.ok) {
          const data = await response.json();
          setAvailableBackgrounds(data);
        }
      } catch (err) {
        console.error('Error loading backgrounds:', err);
      }
    };
    loadBackgrounds();
  }, []);

  const generateBenedictionSlide = async () => {
    if (!leadPastor.trim()) {
      setError('Please enter the lead pastor\'s name.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      let backgroundBase64 = '';
      
      // Get base64 of the background image
      if (backgroundImage) {
        backgroundBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(backgroundImage);
        });
      } else if (selectedBackground) {
        backgroundBase64 = await fetchImageAsBase64(selectedBackground.path);
      } else {
        // Use default ocean-sunrise background
        backgroundBase64 = await fetchImageAsBase64('/images/ocean-sunrise-golden-worship-background.jpg');
      }

      const requestBody = {
        lead_pastor: leadPastor.trim(),
        background_image: backgroundBase64
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://church-documentation-automation-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/generate-benediction-slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to generate benediction slide');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'benediction_slide.pptx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Benediction slide generated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to generate benediction slide');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Benediction</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="benediction-lead-pastor" className="block text-sm font-medium text-gray-700 mb-2">
                Lead Pastor Name
              </label>
              <input
                id="benediction-lead-pastor"
                type="text"
                value={leadPastor}
                onChange={(e) => setLeadPastor(e.target.value)}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Background Image (Optional)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Choose from our gallery or upload your own background image. If no background is selected, the default &quot;Ocean Sunrise Golden&quot; background will be used.
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBackgroundSelector(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose from Gallery
                  </button>
                  <button
                    onClick={() => document.getElementById('benediction-background-input')?.click()}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload New
                  </button>
                </div>

                <input
                  id="benediction-background-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBackgroundImage(file);
                      setSelectedBackground(null);
                      setSuccess(`Image "${file.name}" uploaded successfully!`);
                      setTimeout(() => setSuccess(null), 3000);
                    }
                  }}
                  className="hidden"
                />
                
                {/* Background Display */}
                {(backgroundImage || selectedBackground) ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Selected Background:</p>
                        <p className="text-sm text-blue-700">
                          {backgroundImage ? backgroundImage.name : selectedBackground?.display_name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBackgroundImage(null);
                          setSelectedBackground(null);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-blue-300" style={{ paddingBottom: '39.375%' }}>
                      {uploadedImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={uploadedImageUrl} 
                          alt={backgroundImage?.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : selectedBackground ? (
                        <Image 
                          src={selectedBackground.path} 
                          alt={selectedBackground.display_name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Default Background</p>
                          <p className="text-sm text-gray-500">Ocean Sunrise Golden will be used</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-gray-300" style={{ paddingBottom: '39.375%' }}>
                      <Image 
                        src="/images/ocean-sunrise-golden-worship-background.jpg" 
                        alt="Ocean Sunrise Golden (Default)"
                        fill
                        className="object-cover"
                        sizes="70vw"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={generateBenedictionSlide}
              disabled={isGenerating || !leadPastor.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base font-medium"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Benediction Slide
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose Background Image</h2>
                <button
                  onClick={() => setShowBackgroundSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableBackgrounds.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableBackgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedBackground?.id === bg.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedBackground(bg);
                        setBackgroundImage(null);
                        setShowBackgroundSelector(false);
                      }}
                    >
                      <div className="relative w-full h-32">
                        <Image 
                          src={bg.path} 
                          alt={bg.display_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
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
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}