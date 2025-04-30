import React, { useState, useRef } from 'react';
import { upload } from '../../api';
import './uploadBox.css';

export const UploadBox = ({ onUploadSuccess, isLoading, setIsLoading, selectedNodes, mergeNodes, isMerging }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if ((!textInput && !file) || isLoading) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      if (textInput) {
        formData.append('text', textInput);
      }
      if (file) {
        formData.append('file', file);
      }

      const response = await upload(formData);
      
      if (response) {
        setTextInput('');
        setFile(null);
        setFileName('');
        setSelectedOption(null);
        setShowOptions(false);
        onUploadSuccess();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '10%',
      width: '100%',
      height: '5%',
      left: '0%',
      zIndex: 1000,
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
    }}>
    <button className="upload-button-bl"
            onClick={() => {
              setShowOptions(true);
              setSelectedOption(null);
            }}
            disabled={isLoading}>
      <svg
        aria-hidden="true"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeWidth="2"
          stroke="#fffffff"
          d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125"
          strokeLinejoin="round"
          strokeLinecap="round"
        ></path>
        <path
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          stroke="#fffffff"
          d="M17 15V18M17 21V18M17 18H14M17 18H20"
        ></path>
      </svg>
      Upload
    </button>

      {selectedNodes.length > 0 && (
        <button className="upload-button-yl"
          onClick={() => {
            mergeNodes();
          }}
          disabled={isLoading || isMerging}
        >
          {isMerging ? (
            <div className="loading-spinner" style={{
              width: '20px',
              height: '20px',
              border: '2px solid #272343',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <img 
              src="https://api.iconify.design/fluent:merge-24-filled.svg" 
              alt="Merge" 
              style={{
                width: '20px',
                height: '20px',
                filter: 'invert(0.2)'
              }}
            />
          )}
          {isMerging ? 'Merging...' : 'Merge'}
        </button>
      )}

      {showOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(61, 60, 61, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'auto'
        }}>
          <div style={{
            backgroundColor: '#E3F6F5',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: 'rgb(61,60,61)',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center'
            }}>
              Upload
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              pointerEvents: 'auto'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => setSelectedOption('file')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: selectedOption === 'file' ? 'rgb(61,60,61)' : 'transparent',
                    color: selectedOption === 'file' ? 'rgb(248,234,212)' : 'rgb(61,60,61)',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}
                >
                  <img 
                    src="https://api.iconify.design/fluent:document-24-filled.svg" 
                    alt="File" 
                    style={{
                      width: '20px',
                      height: '20px',
                      filter: selectedOption === 'file' ? 'invert(1)' : 'invert(0.2)'
                    }}
                  />
                  File
                </button>
                <button
                  onClick={() => setSelectedOption('text')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: selectedOption === 'text' ? 'rgb(61,60,61)' : 'transparent',
                    color: selectedOption === 'text' ? 'rgb(248,234,212)' : 'rgb(61,60,61)',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}
                >
                  <img 
                    src="https://api.iconify.design/fluent:text-24-filled.svg" 
                    alt="Text" 
                    style={{
                      width: '20px',
                      height: '20px',
                      filter: selectedOption === 'text' ? 'invert(1)' : 'invert(0.2)'
                    }}
                  />
                  Text
                </button>
              </div>

              {selectedOption === 'file' ? (
                <div style={{
                  border: '2px dashed rgb(61,60,61)',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  pointerEvents: 'auto'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    setFile(file);
                    setFileName(file.name);
                  }
                }}
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <img 
                    src="https://api.iconify.design/fluent:upload-24-filled.svg" 
                    alt="Upload" 
                    style={{
                      width: '32px',
                      height: '32px',
                      marginBottom: '8px',
                      filter: 'invert(0.2)'
                    }}
                  />
                  <p style={{
                    margin: '0',
                    color: 'rgb(61,60,61)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px'
                  }}>
                    {fileName || (
                      <>
                        Drag and drop a video/image here <br />
                        or click to select
                      </>
                    )}
                  </p>
                </div>
              ) : selectedOption === 'text' ? (
                <textarea
                  className="upload-textarea"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Enter your text here...\n\nor Youtube Video link...\ne.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nor website link...\ne.g. https://en.wikipedia.org/wiki/Microsoft_Azure`}
                  style={{
                    width: '93%',
                    height: '200px',
                    padding: '12px',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    resize: 'none',
                    backgroundColor: '#FFFFFE',
                    color: 'rgb(61,60,61)',
                    fontFamily: 'Inter, sans-serif',
                    pointerEvents: 'auto'
                  }}
                />
              ) : ('')}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                {selectedOption ? (
                  <>
                    <button
                      onClick={() => setShowOptions(false)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: 'rgb(61,60,61)',
                        border: '1px solid rgb(61,60,61)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isLoading || (selectedOption === 'text' && !textInput.trim()) || (selectedOption === 'file' && !file)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgb(61,60,61)',
                        color: '#fffffe',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading || (selectedOption === 'text' && !textInput.trim()) || (selectedOption === 'file' && !file) ? 'not-allowed' : 'pointer',
                        opacity: isLoading || (selectedOption === 'text' && !textInput.trim()) || (selectedOption === 'file' && !file) ? 0.5 : 1,
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {isLoading ? 'Uploading...' : 'Upload'}
                    </button>
                  </>
                ) : ('')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 