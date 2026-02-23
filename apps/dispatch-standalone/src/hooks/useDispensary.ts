import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export function useDispensary() {
  const defaultDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID as Id<'dispensaries'> | undefined;
  const first = useQuery(api.dispensaries.getFirst, defaultDispensaryId ? 'skip' : {});

  if (defaultDispensaryId) {
    return { _id: defaultDispensaryId, name: 'Default Dispensary' } as { _id: Id<'dispensaries'>; name: string };
  }

  return first ?? null;
}
