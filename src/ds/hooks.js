import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect warns during the prerender, where there is no layout.
export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
