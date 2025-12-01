import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp'

function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?music\.youtube\.com\/watch\?v=[\w-]+/,
  ]
  return patterns.some(pattern => pattern.test(url.trim()))
}

// Clean URL to remove playlist params and get just the video
function cleanYouTubeUrl(url: string): string {
  try {
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`)
    const videoId = urlObj.searchParams.get('v')
    
    if (videoId) {
      // Return clean URL with just the video ID
      return `https://www.youtube.com/watch?v=${videoId}`
    }
    
    // Handle youtu.be and shorts - strip query params
    if (urlObj.hostname === 'youtu.be') {
      return `https://youtu.be${urlObj.pathname}`
    }
    
    if (urlObj.pathname.includes('/shorts/')) {
      const shortId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0]
      return `https://www.youtube.com/shorts/${shortId}`
    }
    
    return url
  } catch {
    return url
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Clean URL to remove playlist params
    const cleanUrl = cleanYouTubeUrl(url)

    // Get video info using yt-dlp (--no-playlist ensures single video only)
    const { stdout } = await execAsync(
      `${YTDLP_PATH} --no-playlist --extractor-args "youtube:player_client=default" --dump-json "${cleanUrl}"`,
      { timeout: 30000 }
    )

    const info = JSON.parse(stdout)
    
    const title = (info.title || 'Unknown')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    return NextResponse.json({
      title,
      author: info.uploader || info.channel || 'Unknown',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || null,
      videoId: info.id,
    })
  } catch (error) {
    console.error('Error fetching video info:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to fetch video info'
    
    if (message.includes('Private video') || message.includes('unavailable')) {
      return NextResponse.json({ error: 'This video is private or unavailable' }, { status: 400 })
    }
    
    if (message.includes('age')) {
      return NextResponse.json({ error: 'This video is age-restricted' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to fetch video info. Please try again.' }, { status: 500 })
  }
}
