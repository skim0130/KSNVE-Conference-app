'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

type FloorPlanViewerProps = {
  floor: string;
  src: string;
  width: number;
  height: number;
};

export default function FloorPlanViewer({ floor, src, width, height }: FloorPlanViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);

  const openViewer = () => {
    setZoomed(false);
    dialogRef.current?.showModal();
  };

  const closeViewer = () => {
    setZoomed(false);
    dialogRef.current?.close();
  };

  const enterFullscreen = async () => {
    if (dialogRef.current?.requestFullscreen) await dialogRef.current.requestFullscreen();
  };

  return (
    <>
      <div className="floor-plan-stage" data-floor={floor}>
        <button type="button" className="floor-plan-preview" onClick={openViewer} aria-label={`${floor} 배치도 확대 보기`}>
          <Image src={src} alt={`${floor} 행사장 배치도`} width={width} height={height} sizes="(max-width: 760px) 100vw, 720px" />
          <span>눌러서 확대</span>
        </button>
        <div className="floor-plan-pin-layer" aria-hidden="true" data-floor={floor} />
      </div>

      <dialog ref={dialogRef} className="floor-plan-dialog" aria-label={`${floor} 행사장 배치도 전체 화면`} onClose={() => setZoomed(false)}>
        <header>
          <b>{floor} 행사장 배치도</b>
          <button type="button" onClick={enterFullscreen}>전체 화면</button>
          <button type="button" onClick={closeViewer} aria-label="닫기">×</button>
        </header>
        <div className={`floor-plan-dialog-canvas${zoomed ? ' zoomed' : ''}`}>
          <button type="button" onClick={() => setZoomed((current) => !current)} aria-label={zoomed ? '배치도 축소하기' : '배치도 확대하기'}>
            <img src={src} alt={`${floor} 행사장 확대 배치도`} width={width} height={height} />
          </button>
        </div>
      </dialog>
    </>
  );
}
