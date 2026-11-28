import type {Metadata} from 'next';
import SubscribeClient from './SubscribeClient';
import './subscribe.css';

export const metadata:Metadata={
 title:'Imperial Tier Membership | Through Frost and Myth',
 description:'Unlock main-story NSFW chapters, side stories, uncensored art, early chapter access, and supporter privileges via Patreon or Wise.',
};

export default function SubscribePage(){
 return (
  <div className="subscribe-shell">
   <SubscribeClient />
  </div>
 );
}
