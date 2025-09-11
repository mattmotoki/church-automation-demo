'use client';

import { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import SettingsButton from '@/components/SettingsButton';
import BulletinEditor from '@/components/BulletinEditor';
import BackgroundPicker from '@/components/BackgroundPicker';
import { ServiceRoles } from '@/types/bulletin';

interface BackgroundData {
  id: string;
  display_name: string;
  path: string;
  type: string;
}

interface SlideData {
  callToWorship: {
    text: string;
    reference?: string;
  } | null;
  hymns: {
    title: string;
    number: string;
    hymnal: 'UMH' | 'FWS';
  }[];
  scripture: {
    reference: string;
    text: string;
    version?: string;
  } | null;
  lead_pastor?: string;
}

interface DisplayData {
  Text: string;
  Name: string;
  Description: string;
  Personnel: string;
  Standing: boolean;
  wasMatched: boolean;
}

export default function Home() {
  const [data, setData] = useState<DisplayData[] | null>(null);
  const [editedData, setEditedData] = useState<DisplayData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [serviceRoles, setServiceRoles] = useState<ServiceRoles>({});
  const [slideData, setSlideData] = useState<SlideData | null>(null);
  
  // Background picker state
  const [baseBackground, setBaseBackground] = useState<BackgroundData | null>(null);
  const [baseBackgroundFile, setBaseBackgroundFile] = useState<File | null>(null);
  const [hymn1Background, setHymn1Background] = useState<BackgroundData | null>(null);
  const [hymn1BackgroundFile, setHymn1BackgroundFile] = useState<File | null>(null);
  const [hymn2Background, setHymn2Background] = useState<BackgroundData | null>(null);
  const [hymn2BackgroundFile, setHymn2BackgroundFile] = useState<File | null>(null);
  const [hymn3Background, setHymn3Background] = useState<BackgroundData | null>(null);
  const [hymn3BackgroundFile, setHymn3BackgroundFile] = useState<File | null>(null);
  
  // Slide generation state
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slideGenerationError, setSlideGenerationError] = useState<string | null>(null);
  const [slideGenerationSuccess, setSlideGenerationSuccess] = useState<string | null>(null);


  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting file upload:', file.name);
      const formData = new FormData();
      formData.append('htmlFile', file);
      
      // Load and send templates and personnel data
      try {
        const [templatesRes, personnelRes] = await Promise.all([
          fetch('/data/templates.json'),
          fetch('/data/personnel.json')
        ]);
        
        if (templatesRes.ok) {
          const templates = await templatesRes.json();
          formData.append('templates', JSON.stringify(templates));
        }
        
        if (personnelRes.ok) {
          const personnel = await personnelRes.json();
          formData.append('personnel', JSON.stringify(personnel));
        }
      } catch (e) {
        console.warn('Could not load templates/personnel data:', e);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('Calling API at:', `${apiUrl}/api/parse-html`);
      
      const response = await fetch(`${apiUrl}/api/parse-html`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Parse result:', result);

      if (result.success) {
        setData(result.data);
        setEditedData(result.data);
        setFilename(result.filename);
        setSlideData(result.slideData || null);
        // Update service roles if they were detected during parsing
        if (result.serviceRoles) {
          setServiceRoles(result.serviceRoles);
        }
      } else {
        setError(result.error || 'Failed to parse HTML file');
      }
    } catch (err) {
      console.error('Upload error details:', err);
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        setError(`Cannot connect to API server at ${apiUrl}. Please check if the API is running.`);
      } else if (err instanceof Error) {
        setError(`Error processing file: ${err.message}`);
      } else {
        setError('Error processing file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataChange = (updatedData: DisplayData[]) => {
    setEditedData(updatedData);
  };

  const handleServiceRolesChange = (updatedRoles: ServiceRoles) => {
    setServiceRoles(updatedRoles);
  };

  const generateAll = async () => {
    if (!slideData) {
      setSlideGenerationError('No slide data available. Please upload a Planning Center HTML file first.');
      return;
    }

    setIsGeneratingSlides(true);
    setSlideGenerationError(null);
    setSlideGenerationSuccess(null);

    try {
      // Helper function to get background for API call
      const getBackgroundForAPI = async (backgroundData: BackgroundData | null, backgroundFile: File | null) => {
        if (backgroundFile) {
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(backgroundFile);
          });
        } else if (backgroundData) {
          // Convert selected background to base64
          const response = await fetch(backgroundData.path);
          const blob = await response.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
        return null;
      };

      // Prepare data for combined slides endpoint
      const requestBody: any = {};
      
      // Add lead pastor if available
      if (slideData.lead_pastor) {
        requestBody.lead_pastor = slideData.lead_pastor;
      }
      
      // Add base background
      const baseBackgroundData = await getBackgroundForAPI(baseBackground, baseBackgroundFile);
      if (baseBackgroundData) {
        requestBody.base_background = baseBackgroundData;
      }
      
      // Add hymn backgrounds
      const hymnBackgrounds = [
        { bg: hymn1Background, file: hymn1BackgroundFile },
        { bg: hymn2Background, file: hymn2BackgroundFile },
        { bg: hymn3Background, file: hymn3BackgroundFile }
      ];
      
      for (let i = 0; i < 3; i++) {
        const { bg, file } = hymnBackgrounds[i];
        const background = await getBackgroundForAPI(bg, file);
        if (background) {
          requestBody[`hymn${i + 1}_background`] = background;
        }
      }
      
      // Add Call to Worship data
      if (slideData.callToWorship && slideData.callToWorship.text) {
        const lines = slideData.callToWorship.text.trim().split('\n');
        const pairs = [];
        
        for (let i = 0; i < lines.length; i += 2) {
          const leader = lines[i]?.trim() || '';
          const people = lines[i + 1]?.trim() || '';
          if (leader) {
            pairs.push({ Leader: leader, People: people });
          }
        }
        
        if (pairs.length > 0) {
          requestBody.call_to_worship_pairs = pairs;
        }
      }
      
      // Add Hymn data
      const hymnsData = [];
      for (let i = 0; i < Math.min(slideData.hymns.length, 3); i++) {
        const hymn = slideData.hymns[i];
        
        try {
          // Load hymn data from JSON
          const folderName = hymn.hymnal.toLowerCase();
          const hymnPath = `/data/hymns/${folderName}/${hymn.number}.json`;
          console.log(`Fetching hymn data from: ${hymnPath}`);
          const hymnResponse = await fetch(hymnPath);
          
          if (hymnResponse.ok) {
            const hymnData = await hymnResponse.json();
            
            if (hymnData.lyrics) {
              hymnsData.push({
                hymn: {
                  number: hymn.number,
                  title: hymn.title,
                  hymnal: hymn.hymnal,
                  lyrics: hymnData.lyrics,
                  author: hymnData.author || '',
                  composer: hymnData.composer || '',
                  tune_name: hymnData.tune_name || '',
                  text_copyright: hymnData.text_copyright || '',
                  tune_copyright: hymnData.tune_copyright || ''
                }
              });
            }
          } else {
            console.warn(`Hymn file not found: ${hymnPath} (status: ${hymnResponse.status})`);
            // Add placeholder data for missing hymn
            hymnsData.push({
              hymn: {
                number: hymn.number,
                title: hymn.title || `Hymn ${hymn.number}`,
                hymnal: hymn.hymnal
              },
              lyrics: []
            });
          }
        } catch (err) {
          console.error(`Error loading hymn ${i + 1} data:`, err);
        }
      }
      requestBody.hymns = hymnsData;
      
      // Add Scripture data
      if (slideData.scripture && slideData.scripture.reference) {
        console.log('Scripture data from parser:', slideData.scripture);
        try {
          // Parse scripture reference for API
          const refMatch = slideData.scripture.reference.match(/([A-Za-z]+)\s+(\d+):(\d+)\s*-\s*(\d+)/);
          console.log('Scripture reference match:', refMatch);
          if (refMatch) {
            const [, bookName, chapter, startVerse, endVerse] = refMatch;
            
            // Map book name to abbreviation (e.g., "Acts" -> "ACT")
            const bookMap: { [key: string]: string } = {
              'Acts': 'ACT',
              'Genesis': 'GEN',
              'Exodus': 'EXO',
              'Psalms': 'PS',
              'Psalm': 'PS',
              'Matthew': 'MT',
              'Mark': 'MK',
              'Luke': 'LK',
              'John': 'JN',
              // Add more mappings as needed
            };
            
            const book = bookMap[bookName] || bookName.toUpperCase().substring(0, 3);
            const version = (slideData.scripture.version || 'nrsvue').toLowerCase();
            
            // Fetch the verses from the JSON file
            const response = await fetch(`/data/bibles/${version}/${book}_chapter_${chapter}.json`);
            if (response.ok) {
              const chapterData = await response.json();
              const verses = [];
              
              // Extract verses in the range
              const start = parseInt(startVerse);
              const end = parseInt(endVerse);
              
              for (const verse of chapterData.verses || []) {
                if (verse.verse >= start && verse.verse <= end) {
                  verses.push({
                    verse: verse.verse,
                    text: verse.text
                  });
                }
              }
              
              if (verses.length > 0) {
                requestBody.scripture = {
                  reference: { book, chapter: parseInt(chapter) },
                  verses
                };
                console.log('Scripture added to requestBody:', requestBody.scripture);
              }
            } else {
              console.error('Failed to fetch scripture data');
            }
          }
        } catch (err) {
          console.error('Error fetching scripture:', err);
        }
      }
      
      // Generate combined slides
      console.log('Combined slides requestBody:', requestBody);
      console.log('Scripture in request:', requestBody.scripture);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/generate-combined-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Download the combined slides
        const a = document.createElement('a');
        a.href = url;
        a.download = 'complete_service_slides.pptx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 10000);
        
        // Generate individual slide sets
        const individualSlides = [];
        
        // 1. Call to Worship slides
        if (requestBody.call_to_worship_pairs && requestBody.call_to_worship_pairs.length > 0) {
          try {
            const ctwResponse = await fetch(`${apiUrl}/api/generate-call-to-worship`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pairs: requestBody.call_to_worship_pairs,
                background_image: requestBody.base_background
              })
            });
            if (ctwResponse.ok) {
              const blob = await ctwResponse.blob();
              individualSlides.push({ name: 'call_to_worship.pptx', blob });
            }
          } catch (err) {
            console.error('Error generating Call to Worship slides:', err);
          }
        }
        
        // 2. Scripture slides
        if (requestBody.scripture) {
          try {
            const scriptureResponse = await fetch(`${apiUrl}/api/generate-scripture-slides`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: requestBody.scripture.reference,
                verses: requestBody.scripture.verses,
                background_image: requestBody.base_background
              })
            });
            if (scriptureResponse.ok) {
              const blob = await scriptureResponse.blob();
              individualSlides.push({ name: 'scripture.pptx', blob });
            }
          } catch (err) {
            console.error('Error generating Scripture slides:', err);
          }
        }
        
        // 3. Hymn slides (up to 3)
        for (let i = 0; i < requestBody.hymns.length && i < 3; i++) {
          const hymn = requestBody.hymns[i];
          if (hymn && hymn.hymn) {
            try {
              const hymnResponse = await fetch(`${apiUrl}/api/generate-hymn-slides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  hymn: hymn.hymn,
                  background_image: requestBody[`hymn${i + 1}_background`]
                })
              });
              if (hymnResponse.ok) {
                const blob = await hymnResponse.blob();
                const hymnName = hymn.hymn.title ? 
                  `hymn_${hymn.hymn.number}_${hymn.hymn.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx` :
                  `hymn_${i + 1}.pptx`;
                individualSlides.push({ name: hymnName, blob });
              }
            } catch (err) {
              console.error(`Error generating Hymn ${i + 1} slides:`, err);
            }
          }
        }
        
        // Download all individual slides
        for (const slide of individualSlides) {
          const url = window.URL.createObjectURL(slide.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = slide.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        }
        
        // Also generate DOCX bulletin
        if (editedData && editedData.length > 0) {
          try {
            const bulletinResponse = await fetch(`${apiUrl}/api/generate-bulletin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: editedData,
                filename: filename?.replace('.html', '.docx') || 'bulletin.docx'
              })
            });

            if (bulletinResponse.ok) {
              const bulletinBlob = await bulletinResponse.blob();
              const bulletinUrl = window.URL.createObjectURL(bulletinBlob);
              
              // Download bulletin
              setTimeout(() => {
                const a = document.createElement('a');
                a.href = bulletinUrl;
                a.download = filename?.replace('.html', '.docx') || 'bulletin.docx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }, 500); // Slight delay after slides
              
              // Clean up URL after a delay
              setTimeout(() => {
                window.URL.revokeObjectURL(bulletinUrl);
              }, 10000);
              
              setSlideGenerationSuccess('Successfully generated complete service slides and bulletin!');
            } else {
              setSlideGenerationSuccess('Successfully generated complete service slides!');
            }
          } catch (err) {
            console.error('Error generating bulletin:', err);
            setSlideGenerationSuccess('Successfully generated complete service slides!');
          }
        } else {
          setSlideGenerationSuccess('Successfully generated complete service slides!');
        }
      } else {
        console.error('Combined slides generation failed:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        setSlideGenerationError(errorData.detail || 'Failed to generate combined slides');
      }

    } catch (err) {
      setSlideGenerationError('An error occurred while generating slides');
      console.error('Slide generation error:', err);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8 relative">
          {/* Settings button in top right */}
          <div className="absolute top-0 right-0">
            <SettingsButton />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Church Material Automation
          </h1>
          <p className="text-gray-600">
            Upload your Planning Center HTML export to create a service bulletin
          </p>
        </header>

        <div className="space-y-8">
          {/* File Upload Section */}
          <section>
            <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </section>

          {/* Bulletin Editor Section */}
          {data && (
            <section>
              <BulletinEditor 
                data={data} 
                onDataChange={handleDataChange}
                filename={filename || undefined}
              />
            </section>
          )}

          {/* Background Picker Section - Always visible */}
          {true && (
            <section>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Slide Generation Settings</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  Choose background images for automatic slide generation. Upload a Planning Center HTML file to enable slide generation.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BackgroundPicker
                    label="Base Background (Call to Worship + Scripture)"
                    selectedBackground={baseBackground}
                    selectedFile={baseBackgroundFile}
                    onBackgroundSelect={setBaseBackground}
                    onFileSelect={setBaseBackgroundFile}
                  />
                  
                  <BackgroundPicker
                    label="Hymn 1 Background"
                    selectedBackground={hymn1Background}
                    selectedFile={hymn1BackgroundFile}
                    onBackgroundSelect={setHymn1Background}
                    onFileSelect={setHymn1BackgroundFile}
                  />
                  
                  <BackgroundPicker
                    label="Hymn 2 Background"
                    selectedBackground={hymn2Background}
                    selectedFile={hymn2BackgroundFile}
                    onBackgroundSelect={setHymn2Background}
                    onFileSelect={setHymn2BackgroundFile}
                  />
                  
                  <BackgroundPicker
                    label="Hymn 3 Background"
                    selectedBackground={hymn3Background}
                    selectedFile={hymn3BackgroundFile}
                    onBackgroundSelect={setHymn3Background}
                    onFileSelect={setHymn3BackgroundFile}
                  />
                </div>
                
                {/* No file uploaded message */}
                {!slideData && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Upload a Planning Center HTML file to detect slide content and enable generation
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Slide Generation Summary */}
                {slideData && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">Detected Slide Content:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {slideData.callToWorship && (
                        <li>✓ Call to Worship{slideData.callToWorship.reference ? ` (${slideData.callToWorship.reference})` : ''}</li>
                      )}
                      {slideData.hymns.map((hymn, idx) => (
                        <li key={idx}>✓ Hymn {idx + 1}: &quot;{hymn.title}&quot; {hymn.hymnal} {hymn.number}</li>
                      ))}
                      {slideData.scripture && (
                        <li>✓ Scripture: {slideData.scripture.reference} ({slideData.scripture.version})</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Generate All Button - Slides and Bulletin */}
                <div className="mt-6">
                  <button
                    onClick={generateAll}
                    disabled={isGeneratingSlides || !slideData}
                    className={`w-full px-6 py-3 text-white rounded-md transition-colors flex items-center justify-center gap-2 text-base font-medium ${
                      !slideData 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : isGeneratingSlides
                        ? 'bg-purple-500 cursor-wait'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    title={!slideData ? "Please upload a Planning Center HTML file first" : "Generate all slides and bulletin"}
                  >
                    {isGeneratingSlides ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generate Content
                        {slideData && (
                          <span className="text-sm opacity-90 ml-1">
                            (Bulletin + Combined Slides)
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
                
                {slideGenerationError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{slideGenerationError}</p>
                  </div>
                )}

                {slideGenerationSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm">{slideGenerationSuccess}</p>
                  </div>
                )}
              </div>
            </section>
          )}


        </div>
      </div>
    </div>
  );
}