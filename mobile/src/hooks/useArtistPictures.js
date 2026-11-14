import { useEffect, useState } from 'react';
import { ARTISTS } from '../data/discover';
import { loadArtistPictures } from '../services/artistPictures';

/** The gospel artists' YouTube channel pictures, { "<artist name>": "<picture>" }, loaded while `active` */
export default function useArtistPictures(active) {
  const [pictures, setPictures] = useState({});
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    loadArtistPictures(ARTISTS)
      .then((found) => {
        if (alive) setPictures(found);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [active]);
  return pictures;
}
