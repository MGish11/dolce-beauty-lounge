Hero video transcode
====================

Source: assets/source/hero.mp4
  3840x2160, HEVC Main 10, yuv420p10le, 24fps, 241 frames, 10.0417s, ~21 MiB,
  plus an unused AAC track (stripped from every derivative).

HEVC does not decode in Chrome or Firefox, and long-GOP encodes make
currentTime seeking stutter. Every derivative below is ALL-INTRA
(-g 1 -keyint_min 1 -sc_threshold 0) so that every frame is a seek target.
Verified: 241 of 241 frames are I-frames in all three outputs.

The source file is NOT deployed. Only assets/video/ and assets/img/ ship.

--------------------------------------------------------------------------
Primary - H.264, all-intra, 1440p, no audio, faststart          12.83 MB
--------------------------------------------------------------------------
ffmpeg -i assets/source/hero.mp4 -an -vf "scale=2560:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 -crf 26 -preset slow \
  -movflags +faststart assets/video/hero-1440.mp4

NOTE: CRF 26, not 20. All-intra inflates size significantly:
  CRF 20 -> 21.75 MB   CRF 22 -> 17.99 MB
  CRF 24 -> 15.25 MB   CRF 26 -> 12.83 MB  <- first under the ~14 MB budget
The footage is soft, warm and shallow-focus, so CRF 26 holds up well. The
place to watch is terrazzo speckle in the floor reflections.

--------------------------------------------------------------------------
Mobile - 720p                                                    5.93 MB
--------------------------------------------------------------------------
ffmpeg -i assets/source/hero.mp4 -an -vf "scale=1280:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 -crf 23 -preset slow \
  -movflags +faststart assets/video/hero-720.mp4

--------------------------------------------------------------------------
WebM fallback - VP9                                             11.60 MB
--------------------------------------------------------------------------
ffmpeg -i assets/source/hero.mp4 -an -vf "scale=1920:-2" \
  -c:v libvpx-vp9 -profile:v 0 -pix_fmt yuv420p \
  -crf 40 -b:v 0 -g 1 -row-mt 1 \
  assets/video/hero-1080.webm

NOTE the explicit "-profile:v 0 -pix_fmt yuv420p". Without them VP9 inherits
10-bit from the 10-bit source and produces Profile 2, which most GPUs cannot
hardware-decode - fatal for scrubbing, and it comes out LARGER than the H.264
file. CRF 40 (not 32) keeps the 8-bit output smaller than the MP4.

--------------------------------------------------------------------------
Stills
--------------------------------------------------------------------------
ffmpeg -ss 0   -i assets/source/hero.mp4 -frames:v 1 -vf "scale=1920:-2" assets/img/hero-first.jpg
ffmpeg -ss 9.9 -i assets/source/hero.mp4 -frames:v 1 -vf "scale=1920:-2" assets/img/hero-last.jpg

hero-first.jpg is the video poster AND the first frame of the iOS fallback
crossfade; hero-last.jpg is its last frame.

--------------------------------------------------------------------------
Source order in index.html
--------------------------------------------------------------------------
MP4 is listed BEFORE WebM, which is the reverse of the usual advice. Here the
two files are close in weight (12.83 vs 11.60 MB) and H.264 has far broader
hardware-accelerated seek support, which is what the scrub depends on. WebM
remains as a fallback for anything that cannot take the MP4.

The 720p file is selected by a media attribute on its <source>, so a small
viewport never begins fetching the 1440p file. modules/hero.js re-checks with
matchMedia after load and corrects currentSrc if the browser ignored it.
