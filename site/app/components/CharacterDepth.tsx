'use client';

import {useRef, useState, type ReactNode} from 'react';
import {RotateCw} from 'lucide-react';
import '../spatial-scenes.css';

export default function CharacterDepth({children, identity}: {children: ReactNode; identity: string}) {
  const stage = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);

  function resetTilt() {
    stage.current?.style.removeProperty('--camera-x');
    stage.current?.style.removeProperty('--camera-y');
  }

  return <div className="character-depth" data-angle={side}
    onPointerMove={event => {
      if (event.pointerType !== 'mouse' || !stage.current) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      stage.current.style.setProperty('--camera-x', (-y * 9) + 'deg');
      stage.current.style.setProperty('--camera-y', (x * 12) + 'deg');
    }} onPointerLeave={resetTilt}>
    <div ref={stage} className="character-depth-camera">
      <div className="character-depth-cabinet" key={identity}>{children}</div>
    </div>
    <button type="button" className="character-depth-turn" onClick={() => {
      resetTilt();
      setSide(value => (value + 1) % 3);
    }}><RotateCw size={16} aria-hidden="true"/> Turn the stage</button>
  </div>;
}
