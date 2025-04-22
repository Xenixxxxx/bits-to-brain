import React, { useState } from 'react';
import { upload } from '../../api';
import { FaFileUpload, FaFileAlt } from 'react-icons/fa';

export const UploadBox = ({ onUploadSuccess, isLoading, setIsLoading }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

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

      await upload(formData);
      setTextInput('');
      setFile(null);
      setFileName('');
      setSelectedOption(null);
      setShowOptions(false);
      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadOptions = () => {
    if (!showOptions) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        setShowOptions(false);
        setSelectedOption(null);
        setTextInput('');
        setFile(null);
        setFileName('');
      }
    };

    return (
      <div 
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '80%',
          maxWidth: '800px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          {!selectedOption ? (
            <div style={{
              display: 'flex',
              gap: '24px'
            }}>
              <button
                onClick={() => setSelectedOption('file')}
                style={{
                  flex: 1,
                  padding: '24px',
                  fontSize: '18px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  ':hover': {
                    backgroundColor: '#e0e0e0'
                  }
                }}
              >
                <FaFileUpload size={32} color="#4CAF50" />
                <span>上传文件</span>
              </button>
              <button
                onClick={() => setSelectedOption('text')}
                style={{
                  flex: 1,
                  padding: '24px',
                  fontSize: '18px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  ':hover': {
                    backgroundColor: '#e0e0e0'
                  }
                }}
              >
                <FaFileAlt size={32} color="#4CAF50" />
                <span>输入文本</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {selectedOption === 'file' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <label style={{
                    padding: '16px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaFileUpload size={24} color="#4CAF50" />
                    <span>选择文件</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      disabled={isLoading}
                    />
                  </label>
                  {fileName && (
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      已选择文件: {fileName}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 8px'
                  }}>
                    <FaFileAlt size={20} color="#4CAF50" />
                    <span>输入文本</span>
                  </div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="请输入文本..."
                    style={{
                      padding: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setSelectedOption(null);
                    setTextInput('');
                    setFile(null);
                    setFileName('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleUpload}
                  disabled={(!textInput && !file) || isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (!textInput && !file) || isLoading ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!textInput && !file) || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? '上传中...' : '提交'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setShowOptions(true)}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgb(248,234,212)',
            color: 'rgb(61,60,61)',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <img 
            src="https://api.iconify.design/fluent:upload-24-filled.svg" 
            alt="Upload" 
            style={{
              width: '20px',
              height: '20px',
              filter: 'invert(0.2)'
            }}
          />
          Upload
        </button>
      </div>

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
          zIndex: 1001
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
              color: 'rgb(61,60,61)'
            }}>
              Upload File
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
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
                    gap: '8px'
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
                    gap: '8px'
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
                  cursor: 'pointer'
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
                    handleFileChange(e);
                  }
                }}
                onClick={() => {
                  // This is a placeholder for the file input
                }}
                >
                  <input
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
                    color: 'rgb(61,60,61)'
                  }}>
                    Drag and drop a file here, or click to select
                  </p>
                </div>
              ) : (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text here..."
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '12px',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    resize: 'none',
                    backgroundColor: 'white',
                    color: 'rgb(61,60,61)'
                  }}
                />
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  onClick={() => setShowOptions(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'rgb(61,60,61)',
                    border: '1px solid rgb(61,60,61)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isLoading || (selectedOption === 'text' && !textInput.trim())}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgb(61,60,61)',
                    color: 'rgb(248,234,212)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading || (selectedOption === 'text' && !textInput.trim()) ? 'not-allowed' : 'pointer',
                    opacity: isLoading || (selectedOption === 'text' && !textInput.trim()) ? 0.5 : 1
                  }}
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 