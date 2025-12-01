# YT2MP3

Simple, effective YouTube to MP3 converter. Paste a link, get the highest quality audio immediately.

## Features

- 🎵 Highest quality audio extraction (320kbps)
- ⚡ Fast streaming download
- 🎨 Beautiful, minimal UI
- 📱 Mobile responsive
- 🔗 Supports YouTube, YouTube Music, and Shorts

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** yt-dlp for YouTube audio extraction
- **Hosting:** Self-hosted or VPS with yt-dlp installed

## Requirements

- Node.js 18+
- yt-dlp installed (`pip install yt-dlp`)

## Development

```bash
# Install dependencies
npm install

# Set yt-dlp path (optional, defaults to 'yt-dlp')
echo 'YTDLP_PATH=/path/to/yt-dlp' > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Self-hosted / VPS

This app requires `yt-dlp` to be installed on the server:

```bash
pip install yt-dlp
npm run build
npm start
```

### Docker (recommended for deployment)

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip3 install yt-dlp
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

## Note on Vercel

This app uses `yt-dlp` which is a Python application. Vercel's serverless functions don't include yt-dlp by default. For Vercel deployment, you would need to:

1. Use a different YouTube extraction library (less reliable)
2. Set up a separate yt-dlp API server
3. Use Vercel with a custom Docker runtime

## License

MIT
