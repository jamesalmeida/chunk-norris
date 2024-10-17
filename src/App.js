import React, { useState, useCallback, useEffect } from 'react';
import './App.css'; // Assuming you'll have some CSS for layout

function TextChunker() {
  const [text, setText] = useState('');
  const [chunkSize, setChunkSize] = useState(50000); // Default chunk size
  const [chunks, setChunks] = useState([]);
  const [isTextEmpty, setIsTextEmpty] = useState(true);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isCustomSizeSubmitted, setIsCustomSizeSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [copiedChunks, setCopiedChunks] = useState({});
  const [openChunks, setOpenChunks] = useState({});
  const [splitMode, setSplitMode] = useState('character');
  const [wordCount, setWordCount] = useState(0);

  // Predefined chunk sizes
  const chunkSizes = [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 'Custom'];

  // Function to split text into chunks
  const splitIntoChunks = useCallback((inputText, size) => {
    if (!inputText || !size || size <= 0) return [];
    
    const textChunks = [];
    const maxChunks = Math.floor((2 ** 32 - 1) / size);
    
    if (splitMode === 'character') {
      for (let i = 0; i < inputText.length && textChunks.length < maxChunks; i += size) {
        textChunks.push(inputText.substr(i, size));
      }
    } else {
      const words = inputText.split(/\s+/);
      for (let i = 0; i < words.length && textChunks.length < maxChunks; i += size) {
        textChunks.push(words.slice(i, i + size).join(' '));
      }
    }
    
    if ((splitMode === 'character' && inputText.length > size * maxChunks) ||
        (splitMode === 'word' && inputText.split(/\s+/).length > size * maxChunks)) {
      const remainingItems = splitMode === 'character' ? 'characters' : 'words';
      const remainingCount = splitMode === 'character' 
        ? inputText.length - (size * maxChunks) 
        : inputText.split(/\s+/).length - (size * maxChunks);
      textChunks.push(`Warning: ${remainingCount} ${remainingItems} were not included due to array size limitations.`);
    }
    
    return textChunks;
  }, [splitMode]);

  // Handling input text change
  const handleTextChange = useCallback((event) => {
    const newText = event.target.value;
    setText(newText);
    setChunks(splitIntoChunks(newText, chunkSize));
    setIsTextEmpty(newText.length === 0);
    setCharacterCount(newText.length);
    setWordCount(newText.trim() === '' ? 0 : newText.trim().split(/\s+/).length);
  }, [chunkSize, splitIntoChunks]);

  // Handling chunk size change
  const handleChunkSizeChange = useCallback((event) => {
    const selectedSize = event.target.value;
    if (selectedSize === 'Custom') {
      setIsCustomSize(true);
      setChunkSize('');
      setIsCustomSizeSubmitted(false);
      setChunks([]); // Clear chunks when switching to custom
    } else {
      setIsCustomSize(false);
      const newSize = parseInt(selectedSize, 10);
      setChunkSize(newSize);
      setIsCustomSizeSubmitted(true);
      // Don't split text here, it will be handled by useEffect
    }
  }, []);

  const handleCustomSizeChange = useCallback((event) => {
    const newSize = parseInt(event.target.value, 10) || '';
    setChunkSize(newSize);
    setIsCustomSizeSubmitted(false);
  }, []);

  const handleCustomSizeSubmit = useCallback(() => {
    if (chunkSize && text) {
      setIsCustomSizeSubmitted(true);
      // Don't split text here, it will be handled by useEffect
    }
  }, [chunkSize, text]);

  // Function to copy text to clipboard
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log(`Chunk ${index + 1} of ${chunks.length} copied to clipboard`);
      setCopiedChunks(prev => ({ ...prev, [index]: true }));
      setOpenChunks(prev => ({ ...prev, [index]: false }));
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Pasting from clipboard
  const pasteFromClipboard = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      setChunks(splitIntoChunks(clipboardText, chunkSize));
      setIsTextEmpty(clipboardText.length === 0);
      setCharacterCount(clipboardText.length);
      setWordCount(clipboardText.trim() === '' ? 0 : clipboardText.trim().split(/\s+/).length);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  }, [chunkSize, splitIntoChunks]);

  // Add this new function to clear the text
  const clearText = useCallback(() => {
    setText('');
    setChunks([]);
    setIsTextEmpty(true);
    setCharacterCount(0);
  }, []);

  useEffect(() => {
    if (text && chunkSize && !isCustomSize) {
      const newChunks = splitIntoChunks(text, chunkSize);
      setChunks(newChunks);
      
      const maxChunks = Math.floor((2 ** 32 - 1) / chunkSize);
      const totalItems = splitMode === 'character' ? text.length : text.split(/\s+/).length;
      if (totalItems > chunkSize * maxChunks) {
        alert(`Warning: The text is too large to be fully split into chunks of size ${chunkSize}. Some content may be truncated.`);
      }
    } else if (isCustomSize && isCustomSizeSubmitted) {
      const newChunks = splitIntoChunks(text, chunkSize);
      setChunks(newChunks);
      
      const maxChunks = Math.floor((2 ** 32 - 1) / chunkSize);
      const totalItems = splitMode === 'character' ? text.length : text.split(/\s+/).length;
      if (totalItems > chunkSize * maxChunks) {
        alert(`Warning: The text is too large to be fully split into chunks of size ${chunkSize}. Some content may be truncated.`);
      }
    } else {
      setChunks([]);
    }
    setIsTextEmpty(text.length === 0);
    setCharacterCount(text.length);
  }, [text, chunkSize, isCustomSize, isCustomSizeSubmitted, splitIntoChunks, splitMode]);

  useEffect(() => {
    setOpenChunks(chunks.reduce((acc, _, index) => ({ ...acc, [index]: true }), {}));
  }, [chunks]);

  return (
    <div className="App">
      <img className="chunk-norris-header" src={`chunk-norris-header.jpg`} alt="Chunk Norris Header"  />
      <p>Effortlessly split your lengthy texts into manageable <span className="bo">chunks</span> with the <span className="strikeout">click</span> kick of a button.</p>
      <div className="textarea-container">
        <textarea 
          value={text} 
          onChange={handleTextChange} 
          placeholder="Paste or type your large text here..."
        />
        <button 
          className={`paste-button ${isTextEmpty ? 'visible' : 'hidden'}`} 
          onClick={pasteFromClipboard}
        >
          Paste from Clipboard
        </button>
        <button 
          className={`clear-button ${isTextEmpty ? 'hidden' : 'visible'}`} 
          onClick={clearText}
        >
          Clear
        </button>
      </div>
      <div className="controls">
        <div className="chunk-stats">
          <p className="chunk-count">Total Chunks: {chunks.length}</p>
          <p className="character-count">Character Count: {characterCount}</p>
          <p className="word-count">Word Count: {wordCount}</p>
        </div>
        <label className="split-mode-label">
          <select 
            value={splitMode} 
            onChange={(e) => setSplitMode(e.target.value)}
            className="split-mode-select"
          >
            <option value="character">Characters</option>
            <option value="word">Words</option>
          </select>
          {' Chunk Size: '}
          <select value={isCustomSize ? 'Custom' : chunkSize} onChange={handleChunkSizeChange}>
            {chunkSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          {isCustomSize && (
            <>
              <input
                type="number"
                value={chunkSize}
                onChange={handleCustomSizeChange}
                min="1"
                step="1"
                placeholder="Enter custom size"
              />
              {chunkSize && text && !isCustomSizeSubmitted && (
                <button onClick={handleCustomSizeSubmit}>
                  Split into {Math.ceil(text.length / chunkSize)} chunks
                </button>
              )}
            </>
          )}
        </label>
      </div>
      <div className="chunks">
        {chunks.map((chunk, index) => (
          <div key={index} className="chunk">
            <div 
              className="chunk-label" 
              onClick={() => {
                setOpenChunks(prev => {
                  const newState = { ...prev, [index]: !prev[index] };
                  if (newState[index]) {
                    setCopiedChunks(prev => ({ ...prev, [index]: false }));
                  }
                  return newState;
                });
              }}
            >
              <span className={`caret ${openChunks[index] !== false ? '' : 'closed'}`}>▼</span>
              <span>Chunk {index + 1} of {chunks.length}</span>
              <button 
                className={`copy-button ${copiedChunks[index] ? 'copied' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(chunk, index);
                }}
              >
                {copiedChunks[index] ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className={openChunks[index] !== false ? '' : 'closed'}>{chunk}</pre>
          </div>
        ))}
      </div>
      <footer className="github-footer">
        <a href="https://github.com/jamesalmeida/chunk-norris" target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

export default TextChunker;
