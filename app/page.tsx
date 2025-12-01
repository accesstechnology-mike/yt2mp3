'use client'

import { useState, useCallback } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function Home() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [videoTitle, setVideoTitle] = useState('')

  const isValidYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
      /^(https?:\/\/)?music\.youtube\.com\/watch\?v=[\w-]+/,
    ]
    return patterns.some(pattern => pattern.test(url.trim()))
  }

  const handleConvert = useCallback(async () => {
    if (!url.trim()) {
      setError('Please paste a YouTube URL')
      setStatus('error')
      return
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    setVideoTitle('')

    try {
      const infoResponse = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const infoData = await infoResponse.json()

      if (!infoResponse.ok) {
        throw new Error(infoData.error || 'Failed to fetch video info')
      }

      setVideoTitle(infoData.title)

      const downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}`
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${infoData.title}.m4a`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setStatus('success')
      
      setTimeout(() => {
        setStatus('idle')
        setUrl('')
        setVideoTitle('')
      }, 5000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }, [url])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      setError('')
      setStatus('idle')
    } catch {
      // Clipboard access denied
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status !== 'loading') {
      handleConvert()
    }
  }, [handleConvert, status])

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[#ff4d6d] shadow-lg shadow-[var(--accent-glow)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18V6L21 12L9 18Z" fill="white"/>
              <path d="M3 12H7M5 10V14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            YT<span className="text-[var(--accent-primary)]">2</span>MP3
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Paste link → Get highest quality MP3
          </p>
        </div>

        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError('')
                  setStatus('idle')
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://youtube.com/watch?v=..."
                className={`input-field pr-24 ${status === 'error' ? 'animate-shake border-red-500' : ''}`}
                disabled={status === 'loading'}
              />
              <button
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                disabled={status === 'loading'}
              >
                Paste
              </button>
            </div>

            {status === 'error' && error && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </p>
            )}

            <button
              onClick={handleConvert}
              disabled={status === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              {status === 'loading' ? (
                <>
                  <span className="loading-ring" />
                  Converting...
                </>
              ) : status === 'success' ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download Started!
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 3V15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Convert & Download
                </>
              )}
            </button>
          </div>

          {status === 'loading' && (
            <div className="mt-6 space-y-3">
              <div className="progress-bar">
                <div className="progress-fill" />
              </div>
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Extracting highest quality audio...
              </p>
            </div>
          )}

          {status === 'success' && videoTitle && (
            <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>
                  <strong className="block mb-1">Download started!</strong>
                  {videoTitle}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-[var(--text-secondary)] text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p>Supports YouTube, YouTube Music, and Shorts</p>
          <p className="mt-2 opacity-60">Highest quality audio extraction</p>
        </div>
      </div>
    </main>
  )
}
