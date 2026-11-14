// The parts of the screen the guided tour points at. A component marks a part with
// useTourTarget('name') and puts the ref on it; the tour asks where it is on screen.
import { useEffect, useRef } from 'react';

const targets = new Map();

export function useTourTarget(name) {
  const ref = useRef(null);
  useEffect(() => {
    targets.set(name, ref);
    return () => {
      if (targets.get(name) === ref) targets.delete(name);
    };
  }, [name]);
  return ref;
}

/** Where a part is on screen: { x, y, width, height }, or null when it is not showing */
export function measureTourTarget(name) {
  return new Promise((resolve) => {
    const ref = targets.get(name);
    const node = ref && ref.current;
    if (!node || typeof node.measureInWindow !== 'function') {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    setTimeout(() => finish(null), 300);
    try {
      node.measureInWindow((x, y, width, height) => finish(width > 0 && height > 0 ? { x, y, width, height } : null));
    } catch {
      finish(null);
    }
  });
}
