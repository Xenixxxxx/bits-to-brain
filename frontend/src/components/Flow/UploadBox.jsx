import React, { useState } from 'react';
import { upload } from '../../api';

export const UploadBox = ({ onUploadSuccess, isLoading, setIsLoading }) => {
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
      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '800px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="输入文本..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          disabled={isLoading}
        />
        <label style={{
          padding: '8px 16px',
          backgroundColor: '#f0f0f0',
          color: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          opacity: isLoading ? 0.7 : 1,
          pointerEvents: isLoading ? 'none' : 'auto'
        }}>
          选择文件
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isLoading}
          />
        </label>
      </div>

      {fileName && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginTop: '-8px'
        }}>
          已选择文件: {fileName}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={(!textInput && !file) || isLoading}
        style={{
          padding: '8px 16px',
          backgroundColor: (!textInput && !file) || isLoading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (!textInput && !file) || isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          alignSelf: 'flex-end'
        }}
      >
        {isLoading ? '上传中...' : '上传'}
      </button>
    </div>
  );
}; 