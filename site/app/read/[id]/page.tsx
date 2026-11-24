import {notFound} from 'next/navigation';
import {storyIndex} from '../../../lib/story';
import ReadingRoom from '../../components/ReadingRoom';
export default async function ChapterPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!id.startsWith('en_book')||!storyIndex.some(c=>c.id===id))notFound();return <ReadingRoom initialChapter={id}/>;}
