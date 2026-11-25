'use client';
/** Pure CSS atmospheric wrapper — zero continuous JS/RAF canvas loops. */
export default function ExperienceAtmosphere({variant='world'}:{variant?:'world'|'archive'|'reader'}){
 return <div className={'experience-atmosphere atmosphere-'+variant} aria-hidden="true"/>;
}
