# Nostalgia TV

A self-hosted Stremio addon that streams live nostalgic TV — retro cartoons, classic shows, and music channels from the 90s and 2000s.

## Channels

**Toonami Aftermath**
- Toonami Aftermath East
- Toonami Aftermath West
- Toonami Aftermath Movies
- Toonami Radio
- SNICKelodeon East
- SNICKelodeon West
- MTV '97

**Adult Swim / CN**
- Swim Rewind
- Cartoon Cartoons Network
- After Swim
- Verniy TV
- RetroStrange TV

**Pluto TV**
- 90s Kids
- Forever Kids
- Nickelodeon
- Naruto
- One Piece
- Sailor Moon
- Yu-Gi-Oh!
- Inuyasha
- Pokemon
- Anime

## Requirements

- Node.js 18 or later
- A network-accessible host if you want Stremio on other devices to reach it

## Setup

**1. Clone the repo**

```
git clone https://github.com/your-username/nostalgia-tv.git
cd nostalgia-tv
```

**2. Install dependencies**

```
npm install
```

**3. Configure environment**

```
cp .env.example .env
```

Edit `.env` and set `BASE_URL` to the address Stremio will use to reach your server. If you are only using Stremio on the same machine, the default `http://127.0.0.1:7000` works without any changes.

**4. Start the server**

```
npm start
```

The addon will be available at `http://127.0.0.1:7000/manifest.json`.

## Installing in Stremio

1. Open Stremio
2. Go to the Addons section
3. Click the puzzle piece icon or "Install addon from URL"
4. Enter your manifest URL: `http://127.0.0.1:7000/manifest.json`
5. Click Install

## Environment Variables

| Variable   | Default                    | Description                                              |
|------------|----------------------------|----------------------------------------------------------|
| `PORT`     | `7000`                     | Port the server listens on                               |
| `BASE_URL` | `http://127.0.0.1:{PORT}`  | Public base URL used in poster and manifest image links  |

`BASE_URL` must be set to a reachable address when running on a remote server or NAS. For example: `http://192.168.1.100:7000`

## Development

Run with auto-restart on file changes:

```
npm run dev
```

Run the test suite:

```
npm test
```

## Stream Caching

Stream URLs are resolved at startup and refreshed every 5 minutes in the background. Stremio receives a direct HLS URL — no proxying occurs. If a source is temporarily unreachable, the last known URL is served until the next successful refresh.

## License

MIT
