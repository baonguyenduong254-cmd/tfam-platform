'use client';

import type {ReactNode} from 'react';
import {ImperialPageVeil} from './components/ImperialMotion';

export default function Template({children}: {children: ReactNode}) {
  return <ImperialPageVeil>{children}</ImperialPageVeil>;
}
