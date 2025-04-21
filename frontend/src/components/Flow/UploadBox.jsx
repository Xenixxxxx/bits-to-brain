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
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',  // 改为固定距离底部20px
        left: '35%',
        transform: 'translateX(-50%)',
        zIndex: 100
      }}>
        <button
          onClick={() => setShowOptions(true)}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)'
            }
          }}
        >
          Upload
        </button>
      </div>
      {renderUploadOptions()}
    </>
  );
}; 