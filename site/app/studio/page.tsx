import type { Metadata } from 'next';
import Studio from './studio';
import './studio.css';

export const metadata: Metadata = { title: 'TFAM Studio', robots: { index: false, follow: false } };

export default function StudioPage() {
  return <Studio/>;
}
