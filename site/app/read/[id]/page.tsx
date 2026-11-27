import {notFound,redirect} from 'next/navigation';
import {isArchivedEnglishChapter,storyIndex} from '../../../lib/story';
import ReadingRoom from '../../components/ReadingRoom';
export default async function ChapterPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(isArchivedEnglishChapter(id)){const num=id.replace(/^en_book1_/,'').padStart(3,'0');const nextId='en_book1_final_'+num;if(storyIndex.some(c=>c.id===nextId))redirect('/read/'+nextId);notFound();}if(!id.startsWith('en_book')||!storyIndex.some(c=>c.id===id))notFound();return <ReadingRoom initialChapter={id}/>;}
