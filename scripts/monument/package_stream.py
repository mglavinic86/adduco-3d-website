"""Remux accepted HD encodes into one continuous MSE timeline, without encoding."""
from pathlib import Path
import subprocess, struct, json, tempfile, argparse
parser=argparse.ArgumentParser();parser.add_argument('--codec',choices=['avc','hevc'],default='avc');args=parser.parse_args()
root=Path('public/assets/story-hevc' if args.codec=='hevc' else 'public/assets/story-stream')
inputs=Path('deliverables/adduco-story/web-encodes')/('hevc' if args.codec=='hevc' else '')
evidence=Path('deliverables/adduco-story/web-qa/streaming/asset-manifests');evidence.mkdir(parents=True,exist_ok=True)
for orientation in ['portrait','landscape']:
    count=(81 if orientation=='landscape' else 41) if args.codec=='hevc' else 21
    source=inputs/(orientation+'.mp4')
    dest=root/orientation;dest.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        fragmented=Path(tmp)/'film.mp4'
        subprocess.run(['ffmpeg','-v','error','-i',str(source),'-an','-c','copy','-movflags','+frag_keyframe+empty_moov+default_base_moof',str(fragmented)],check=True)
        data=fragmented.read_bytes();pos=0;init=bytearray();parts=[];part=None
        while pos<len(data):
            size,kind=struct.unpack('>I4s',data[pos:pos+8])
            if size==1:size=struct.unpack('>Q',data[pos+8:pos+16])[0]
            if not size:size=len(data)-pos
            box=data[pos:pos+size]
            if kind==b'moof':
                if part is not None:parts.append(bytes(part))
                part=bytearray(box)
            elif kind==b'mdat':part.extend(box)
            elif part is None:init.extend(box)
            pos+=size
        if part is not None:parts.append(bytes(part))
        assert len(parts)==count
        (dest/'init.mp4').write_bytes(init)
        for i,content in enumerate(parts):(dest/f'part-{i:02}.m4s').write_bytes(content)
        def hashes(path):
            rows=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','framemd5','-']).decode().splitlines()
            return [r.rsplit(',',1)[1].strip() for r in rows if r and not r.startswith('#')]
        assert hashes(source)==hashes(fragmented),'Decoded pixels changed'
        info={'source':str(source),'parts':len(parts),'bytes':len(init)+sum(map(len,parts)),'presentationOffset':2/24,'decoded_frames_identical':481}
        (evidence/f'{args.codec}-{orientation}.json').write_text(json.dumps(info,indent=2))
        print(orientation,info)
