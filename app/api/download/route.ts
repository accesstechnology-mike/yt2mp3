import { NextRequest } from 'next/server'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new Response('URL is required', { status: 400 })
  }

  if (!isValidYouTubeUrl(url)) {
    return new Response('Invalid YouTube URL', { status: 400 })
  }

  try {
    const { stdout: infoJson } = await execAsync(
      `${YTDLP_PATH} --extractor-args "youtube:player_client=default" --print "%(title)s" "${url}"`,
      { timeout: 30000 }
    )
    
    const title = infoJson.trim()
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'audio'

    const filename = `${title}.m4a`
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape)

    const ytdlp = spawn(YTDLP_PATH, [
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--extractor-args', 'youtube:player_client=default',
      '-o', '-',
      url,
    ])

    const webStream = new ReadableStream({
      start(controller) {
        ytdlp.stdout.on('data', (chunk) => {
          controller.enqueue(chunk)
        })

        ytdlp.stdout.on('end', () => {
          controller.close()
        })

        ytdlp.stderr.on('data', (data) => {
          const msg = data.toString()
          if (!msg.includes('[download]') && !msg.includes('WARNING')) {
            console.error('yt-dlp stderr:', msg)
          }
        })

        ytdlp.on('error', (err) => {
          console.error('yt-dlp process error:', err)
          controller.error(err)
        })

        ytdlp.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`yt-dlp exited with code ${code}`)
          }
        })
      },
      cancel() {
        ytdlp.kill('SIGTERM')
      }
    })

    return new Response(webStream, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    const message = error instanceof Error ? error.message : 'Download failed'
    return new Response(message, { status: 500 })
  }
}
