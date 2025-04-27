import React, { useState, useRef } from 'react';
import { upload } from '../../api';
import { FaFileUpload, FaFileAlt } from 'react-icons/fa';

export const UploadBox = ({ onUploadSuccess, isLoading, setIsLoading, selectedNodes, mergeNodes }) => {
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
      height: '10%',
      left: '0%',
      zIndex: 1000,
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
    }}>
      <button
        onClick={() => {
          setShowOptions(true);
          setSelectedOption(null);
        }}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          backgroundColor: '#272343',
          color: '#fffffe',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          opacity: isLoading ? 0.5 : 1,
          fontFamily: 'Inter, sans-serif',
          width: '200px',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
      >
        <img 
          src="https://api.iconify.design/fluent:upload-24-filled.svg" 
          alt="Upload" 
          style={{
            width: '20px',
            height: '20px',
            filter: 'invert(1)'
          }}
        />
        Upload
      </button>

      {selectedNodes.length > 0 && (
        <button
          onClick={() => {
            mergeNodes();
          }}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffd803',
            color: '#272343',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            opacity: isLoading ? 0.5 : 1,
            fontFamily: 'Inter, sans-serif',
            width: '200px',
            pointerEvents: 'auto'
          }}
        >
          <img 
            src="https://api.iconify.design/fluent:merge-24-filled.svg" 
            alt="Merge" 
            style={{
              width: '20px',
              height: '20px',
              filter: 'invert(0.2)'
            }}
          />
          Merge
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
            backgroundColor: 'rgb(248,234,212)',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'rgb(61,60,61)',
              fontFamily: 'Inter, sans-serif'
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
                    fontFamily: 'Inter, sans-serif'
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
                    fontFamily: 'Inter, sans-serif'
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
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {fileName || 'Drag and drop a file here, or click to select'}
                  </p>
                </div>
              ) : selectedOption === 'text' ? (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text/url here..."
                  style={{
                    width: '93%',
                    height: '200px',
                    padding: '12px',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    resize: 'none',
                    backgroundColor: 'white',
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
                        color: '#272343',
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