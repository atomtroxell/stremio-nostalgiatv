'use strict';

const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 7000}`;

// Central channel registry — single source of truth for all phases.
module.exports = [
  // Toonami Aftermath — 7 channels
  { id: 'ntv-toonamiaftermath-est',      name: 'Toonami Aftermath East',   description: 'Toonami Aftermath East — classic Toonami-era shows, live on toonamiaftermath.com',   poster: `${BASE_URL}/public/images/toonami-aftermath.png` },
  { id: 'ntv-toonamiaftermath-pst',      name: 'Toonami Aftermath West',   description: 'Toonami Aftermath West — classic Toonami-era shows, live on toonamiaftermath.com',   poster: `${BASE_URL}/public/images/toonami-aftermath.png` },
  { id: 'ntv-toonamiaftermath-movies',   name: 'Toonami Aftermath Movies', description: 'Toonami Aftermath Movies — live on toonamiaftermath.com',                             poster: `${BASE_URL}/public/images/toonami-aftermath-movies.png` },
  { id: 'ntv-toonamiaftermath-radio',    name: 'Toonami Radio',            description: 'Toonami Radio — live on toonamiaftermath.com',                                         poster: `${BASE_URL}/public/images/toonami-aftermath.png` },
  { id: 'ntv-toonamiaftermath-snickest', name: 'SNICKelodeon East',        description: 'SNICKelodeon East — live on toonamiaftermath.com',                                     poster: `${BASE_URL}/public/images/toonami-aftermath-snickelodeon.png` },
  { id: 'ntv-toonamiaftermath-snickpst', name: 'SNICKelodeon West',        description: 'SNICKelodeon West — live on toonamiaftermath.com',                                     poster: `${BASE_URL}/public/images/toonami-aftermath-snickelodeon.png` },
  { id: 'ntv-toonamiaftermath-mtv97',    name: "MTV '97",                  description: "MTV '97 — live on toonamiaftermath.com",                                               poster: `${BASE_URL}/public/images/toonami-aftermath-mtv97.png` },

  // Swim Rewind — 1 channel
  { id: 'ntv-swimrewind', name: 'Swim Rewind', description: 'Swim Rewind — 2000s TV, CN, Toonami and Adult Swim nostalgia', poster: `${BASE_URL}/public/images/swim-rewind.png` },

  // Owncast channels — HLS, no auth, TV-safe
  { id: 'ntv-ccn',          name: 'Cartoon Cartoons Network', description: 'Classic CN, Hanna-Barbera, WB and Toonami blocks — live on cartooncartoons.thatsoretro.com', poster: `${BASE_URL}/public/images/ccn.png` },
  { id: 'ntv-afterswim',    name: 'After Swim',               description: 'Adult Swim and Toonami nostalgia — live on owncast.afterswim.org',                           poster: `${BASE_URL}/public/images/afterswim.png` },
  { id: 'ntv-verniy',       name: 'Verniy TV',                description: 'Cartoon Network, Adult Swim and anime mix — live on live.verniy.tv',                         poster: `${BASE_URL}/public/images/verniy.png` },
  { id: 'ntv-retrostrange', name: 'RetroStrange TV',          description: 'Vintage sci-fi, classic TV and public domain content — live on live.retrostrange.com',       poster: `${BASE_URL}/public/images/retro-strange.png` },

  // Pluto TV — HLS via jmp2.uk proxy (handles token refresh)
  { id: 'ntv-pluto-90skids',     name: 'Pluto TV: 90s Kids',     description: 'Rugrats, Doug, Hey Arnold, Rocko and more — Pluto TV', poster: `${BASE_URL}/public/images/pluto-90s-kids.png` },
  { id: 'ntv-pluto-foreverkids', name: 'Pluto TV: Forever Kids',  description: '90s kids content, all day — Pluto TV',                poster: `${BASE_URL}/public/images/pluto-forever-kids.png` },
  { id: 'ntv-pluto-nick',        name: 'Pluto TV: Nickelodeon',   description: 'Classic Nickelodeon — Pluto TV',                       poster: `${BASE_URL}/public/images/pluto-nickelodeon.png` },
  { id: 'ntv-pluto-naruto',      name: 'Pluto TV: Naruto',        description: 'Naruto, 24/7 — Pluto TV',                             poster: `${BASE_URL}/public/images/pluto-naruto.png` },
  { id: 'ntv-pluto-onepiece',    name: 'Pluto TV: One Piece',     description: 'One Piece, 24/7 — Pluto TV',                          poster: `${BASE_URL}/public/images/pluto-one-piece.png` },
  { id: 'ntv-pluto-sailormoon',  name: 'Pluto TV: Sailor Moon',   description: 'Sailor Moon, 24/7 — Pluto TV',                        poster: `${BASE_URL}/public/images/pluto-sailor-moon.png` },
  { id: 'ntv-pluto-yugioh',      name: 'Pluto TV: Yu-Gi-Oh!',     description: 'Yu-Gi-Oh!, 24/7 — Pluto TV',                          poster: `${BASE_URL}/public/images/pluto-yu-gi-oh.png` },
  { id: 'ntv-pluto-inuyasha',    name: 'Pluto TV: Inuyasha',      description: 'Inuyasha, 24/7 — Pluto TV',                           poster: `${BASE_URL}/public/images/pluto-inuyasha.png` },
  { id: 'ntv-pluto-pokemon',     name: 'Pluto TV: Pokémon',       description: 'Pokémon, 24/7 — Pluto TV',                            poster: `${BASE_URL}/public/images/pluto-pokemon.png` },
  { id: 'ntv-pluto-anime',       name: 'Pluto TV: Anime',         description: 'General anime mix — Pluto TV',                        poster: `${BASE_URL}/public/images/pluto-anime.png` },
];
