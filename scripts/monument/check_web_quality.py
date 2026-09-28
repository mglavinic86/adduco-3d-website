"""Check detail retention against independent production masters, not web copies."""
import argparse
import json
import re
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--media-root', type=Path, default=Path('deliverables/adduco-story/web-encodes'))
parser.add_argument('--output', type=Path)
args = parser.parse_args()
masters = {
    'landscape': 'deliverables/adduco-story/higgsfield/adduco-active-site-v2.mp4',
    'portrait': 'deliverables/adduco-story/higgsfield/portrait-film-result.mp4',
}
results = {}
for orientation, master in masters.items():
    candidate = args.media_root / f'{orientation}.mp4'
    dims = (1920, 1080) if orientation == 'landscape' else (1080, 1920)
    info = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
        'stream=width,height,nb_frames', '-of', 'json', str(candidate),
    ]))['streams'][0]
    # Normalize resolution before measuring to expose losses from both scaling
    # and quantization. SSIM is fidelity to the master, not a realism rating.
    result = subprocess.run([
        'ffmpeg', '-hide_banner', '-i', str(candidate), '-i', master,
        '-filter_complex',
        f'[0:v]scale={dims[0]}:{dims[1]}:flags=lanczos,setpts=PTS-STARTPTS[a];'
        '[1:v]setpts=PTS-STARTPTS[b];[a][b]ssim',
        '-an', '-f', 'null', '/dev/null',
    ], capture_output=True, text=True, check=True)
    score = float(re.findall(r'All:([\d.]+)', result.stderr)[-1])
    results[orientation] = {
        'ssim': score, 'native_resolution': [info['width'], info['height']] == list(dims),
        'frames': int(info['nb_frames']), 'bytes': candidate.stat().st_size,
        'passes': score >= 0.98 and [info['width'], info['height']] == list(dims) and int(info['nb_frames']) == 481,
    }
print(json.dumps(results, indent=2))
if args.output:
    args.output.write_text(json.dumps(results, indent=2) + '\n')
raise SystemExit(0 if all(r['passes'] for r in results.values()) else 1)
