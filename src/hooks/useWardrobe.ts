import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle, signOutUser } from '../firebase';
import {
  type ClothingCategory,
  createStarterWardrobeItems,
  validateWardrobeItemName,
  type WardrobeItemRecord,
} from '../outfitData';

export interface UseWardrobeResult {
  user: User | null;
  authReady: boolean;
  loadingWardrobe: boolean;
  items: WardrobeItemRecord[];
  authActionPending: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addItem: (category: ClothingCategory, rawName: string) => Promise<{ ok: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export function useWardrobe(): UseWardrobeResult {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingWardrobe, setLoadingWardrobe] = useState(false);
  const [items, setItems] = useState<WardrobeItemRecord[]>(() => createStarterWardrobeItems());
  const [authActionPending, setAuthActionPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const guestEditedRef = useRef(false);
  const latestGuestItemsRef = useRef<WardrobeItemRecord[]>(items);

  useEffect(() => {
    if (!user) {
      latestGuestItemsRef.current = items;
    }
  }, [items, user]);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError(null);
      if (!nextUser) {
        guestEditedRef.current = false;
        setItems(createStarterWardrobeItems());
        setLoadingWardrobe(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }

    let cancelled = false;
    let unsubscribeSnapshot: (() => void) | undefined;

    const profilePath = `users/${user.uid}`;
    const itemsPath = `users/${user.uid}/items`;

    async function initAndSubscribe(currentUser: User) {
      setLoadingWardrobe(true);
      try {
        const profileRef = doc(db, 'users', currentUser.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(profileRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, profilePath);
        }

        if (cancelled) return;

        if (!profileSnap.exists()) {
          const seedSource = guestEditedRef.current
            ? latestGuestItemsRef.current
            : createStarterWardrobeItems();

          const batch = writeBatch(db);
          batch.set(profileRef, {
            ownerId: currentUser.uid,
            initialized: true,
            createdAt: serverTimestamp(),
          });

          for (const item of seedSource) {
            const newItemRef = doc(collection(db, 'users', currentUser.uid, 'items'));
            batch.set(newItemRef, {
              ownerId: currentUser.uid,
              category: item.category,
              name: item.name,
              createdAt: serverTimestamp(),
            });
          }

          try {
            await batch.commit();
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, itemsPath);
          }
          guestEditedRef.current = false;
        }

        if (cancelled) return;

        const itemsQuery = query(
          collection(db, 'users', currentUser.uid, 'items'),
          where('ownerId', '==', currentUser.uid)
        );

        unsubscribeSnapshot = onSnapshot(
          itemsQuery,
          (snapshot) => {
            const nextItems: WardrobeItemRecord[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
              return {
                id: docSnap.id,
                category: data.category as ClothingCategory,
                name: String(data.name ?? ''),
                createdAtMs: createdAt,
              };
            });
            nextItems.sort((a, b) => a.createdAtMs - b.createdAtMs || a.name.localeCompare(b.name));
            setItems(nextItems);
            setLoadingWardrobe(false);
          },
          (error) => {
            try {
              handleFirestoreError(error, OperationType.LIST, itemsPath);
            } catch (wrapped) {
              setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
            }
          }
        );
      } catch (error) {
        if (!cancelled) {
          setLoadingWardrobe(false);
          setFatalError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    void initAndSubscribe(user);

    return () => {
      cancelled = true;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [authReady, user]);

  const signIn = useCallback(async () => {
    setAuthActionPending(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed.';
      if (!message.includes('popup-closed-by-user')) {
        setAuthError('Could not complete Google sign-in. Please try again.');
      }
    } finally {
      setAuthActionPending(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthActionPending(true);
    setAuthError(null);
    try {
      await signOutUser();
    } catch {
      setAuthError('Could not sign out. Please try again.');
    } finally {
      setAuthActionPending(false);
    }
  }, []);

  const addItem = useCallback(
    async (category: ClothingCategory, rawName: string): Promise<{ ok: boolean; error?: string }> => {
      const validation = validateWardrobeItemName(rawName);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      const normalizedLower = validation.normalized.toLowerCase();
      const duplicate = items.some(
        (item) => item.category === category && item.name.toLowerCase() === normalizedLower
      );
      if (duplicate) {
        return { ok: false, error: 'That item is already in this category.' };
      }

      if (!user) {
        guestEditedRef.current = true;
        const newItem: WardrobeItemRecord = {
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          category,
          name: validation.normalized,
          createdAtMs: Date.now(),
        };
        setItems((prev) => [...prev, newItem]);
        return { ok: true };
      }

      const itemsPath = `users/${user.uid}/items`;
      const newDocRef = doc(collection(db, 'users', user.uid, 'items'));
      try {
        await setDoc(newDocRef, {
          ownerId: user.uid,
          category,
          name: validation.normalized,
          createdAt: serverTimestamp(),
        });
        return { ok: true };
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.CREATE, `${itemsPath}/${newDocRef.id}`);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
        return { ok: false, error: 'Failed to save item.' };
      }
    },
    [items, user]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user) {
        guestEditedRef.current = true;
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return;
      }

      const docPath = `users/${user.uid}/items/${itemId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'items', itemId));
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, docPath);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    },
    [user]
  );

  const resetToDefault = useCallback(async (): Promise<void> => {
    const starter = createStarterWardrobeItems();
    if (!user) {
      guestEditedRef.current = false;
      setItems(starter);
      return;
    }

    const itemsPath = `users/${user.uid}/items`;
    const batch = writeBatch(db);
    for (const existing of items) {
      batch.delete(doc(db, 'users', user.uid, 'items', existing.id));
    }
    for (const item of starter) {
      const newRef = doc(collection(db, 'users', user.uid, 'items'));
      batch.set(newRef, {
        ownerId: user.uid,
        category: item.category,
        name: item.name,
        createdAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, itemsPath);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  }, [items, user]);

  return {
    user,
    authReady,
    loadingWardrobe,
    items,
    authActionPending,
    authError,
    signIn,
    signOut,
    addItem,
    removeItem,
    resetToDefault,
  };
}
