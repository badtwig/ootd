import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  RefreshCw,
  Snowflake,
  Sun,
} from 'lucide-react';
import { GarmentIllustration } from './components/GarmentIllustration';
import { WardrobePanel } from './components/WardrobePanel';
import { useWardrobe } from './hooks/useWardrobe';
import {
  buildColdStylishCombos,
  buildStylishCombos,
  type ColdOutfitCombo,
  formatGarmentName,
  type OutfitCombo,
} from './outfitData';

function pickRandomRegular(
  combos: OutfitCombo[],
  current?: OutfitCombo,
  filterFn?: (combo: OutfitCombo) => boolean
): OutfitCombo | null {
  const pool = filterFn ? combos.filter(filterFn) : combos;
  if (pool.length === 0) return null;
  const candidates =
    pool.length > 1 && current
      ? pool.filter((c) => c.shirt !== current.shirt || c.trouser !== current.trouser)
      : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

function pickRandomCold(
  combos: ColdOutfitCombo[],
  current?: ColdOutfitCombo,
  filterFn?: (combo: ColdOutfitCombo) => boolean
): ColdOutfitCombo | null {
  const pool = filterFn ? combos.filter(filterFn) : combos;
  if (pool.length === 0) return null;
  const candidates =
    pool.length > 1 && current
      ? pool.filter(
          (c) =>
            c.shirt !== current.shirt ||
            c.trouser !== current.trouser ||
            c.upper !== current.upper
        )
      : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

export default function App() {
  const {
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
  } = useWardrobe();

  const shirts = useMemo(
    () => items.filter((i) => i.category === 'shirt').map((i) => i.name),
    [items]
  );
  const uppers = useMemo(
    () => items.filter((i) => i.category === 'upper').map((i) => i.name),
    [items]
  );
  const trousers = useMemo(
    () => items.filter((i) => i.category === 'trouser').map((i) => i.name),
    [items]
  );

  const regularCombos = useMemo(
    () => buildStylishCombos(shirts, trousers),
    [shirts, trousers]
  );
  const coldCombos = useMemo(
    () => buildColdStylishCombos(uppers, shirts, trousers),
    [uppers, shirts, trousers]
  );

  // Fallback combos if user only keeps clashing colors in their custom wardrobe
  const fallbackRegularCombos = useMemo<OutfitCombo[]>(
    () =>
      regularCombos.length > 0
        ? regularCombos
        : shirts.flatMap((shirt) => trousers.map((trouser) => ({ shirt, trouser }))),
    [regularCombos, shirts, trousers]
  );

  const fallbackColdCombos = useMemo<ColdOutfitCombo[]>(
    () =>
      coldCombos.length > 0
        ? coldCombos
        : uppers.flatMap((upper) =>
            shirts.flatMap((shirt) => trousers.map((trouser) => ({ upper, shirt, trouser })))
          ),
    [coldCombos, uppers, shirts, trousers]
  );

  const [isColdDay, setIsColdDay] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [outfit, setOutfit] = useState<ColdOutfitCombo>(() => ({
    shirt: shirts[0] ?? '',
    upper: uppers[0] ?? '',
    trouser: trousers[0] ?? '',
  }));

  // Keep current outfit valid whenever wardrobe items load or change
  useEffect(() => {
    setOutfit((prev) => {
      if (isColdDay) {
        const stillValid = fallbackColdCombos.some(
          (c) => c.shirt === prev.shirt && c.upper === prev.upper && c.trouser === prev.trouser
        );
        if (stillValid) return prev;
        return (
          pickRandomCold(fallbackColdCombos, prev) ?? {
            shirt: shirts[0] ?? '',
            upper: uppers[0] ?? '',
            trouser: trousers[0] ?? '',
          }
        );
      }

      const stillValidRegular = fallbackRegularCombos.some(
        (c) => c.shirt === prev.shirt && c.trouser === prev.trouser
      );
      if (stillValidRegular) {
        return {
          ...prev,
          upper: uppers.includes(prev.upper) ? prev.upper : uppers[0] ?? '',
        };
      }
      const nextReg = pickRandomRegular(fallbackRegularCombos, prev);
      return {
        shirt: nextReg?.shirt ?? shirts[0] ?? '',
        trouser: nextReg?.trouser ?? trousers[0] ?? '',
        upper: uppers.includes(prev.upper) ? prev.upper : uppers[0] ?? '',
      };
    });
  }, [isColdDay, fallbackRegularCombos, fallbackColdCombos, shirts, uppers, trousers]);

  const handleWeatherChange = (cold: boolean) => {
    setIsColdDay(cold);
    if (cold) {
      setOutfit((prev) => {
        const matching = fallbackColdCombos.filter(
          (c) => c.shirt === prev.shirt && c.trouser === prev.trouser
        );
        if (matching.length > 0) {
          const keepUpper = matching.find((c) => c.upper === prev.upper);
          if (keepUpper) return keepUpper;
          return matching[Math.floor(Math.random() * matching.length)];
        }
        return pickRandomCold(fallbackColdCombos, prev) ?? prev;
      });
    }
  };

  const handleNewOutfit = useCallback(() => {
    setOutfit((prev) => {
      if (isColdDay) {
        return pickRandomCold(fallbackColdCombos, prev) ?? prev;
      }
      const nextReg = pickRandomRegular(fallbackRegularCombos, prev);
      return nextReg ? { ...nextReg, upper: prev.upper } : prev;
    });
  }, [isColdDay, fallbackColdCombos, fallbackRegularCombos]);

  const handlePickShirt = (shirt: string) => {
    setOutfit((prev) => {
      if (isColdDay) {
        return pickRandomCold(fallbackColdCombos, prev, (c) => c.shirt === shirt) ?? prev;
      }
      const nextReg = pickRandomRegular(fallbackRegularCombos, prev, (c) => c.shirt === shirt);
      return nextReg ? { ...nextReg, upper: prev.upper } : prev;
    });
  };

  const handlePickUpper = (upper: string) => {
    setIsColdDay(true);
    setOutfit((prev) => pickRandomCold(fallbackColdCombos, prev, (c) => c.upper === upper) ?? prev);
  };

  const handlePickTrouser = (trouser: string) => {
    setOutfit((prev) => {
      if (isColdDay) {
        return pickRandomCold(fallbackColdCombos, prev, (c) => c.trouser === trouser) ?? prev;
      }
      const nextReg = pickRandomRegular(fallbackRegularCombos, prev, (c) => c.trouser === trouser);
      return nextReg ? { ...nextReg, upper: prev.upper } : prev;
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (e.code === 'Space' && !isInput && target === document.body) {
        e.preventDefault();
        handleNewOutfit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNewOutfit]);

  const missingCategory =
    shirts.length === 0 || trousers.length === 0 || (isColdDay && uppers.length === 0);
  const usingFallback = isColdDay ? coldCombos.length === 0 : regularCombos.length === 0;
  const activeComboCount = isColdDay ? coldCombos.length : regularCombos.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f9]">
      {/* Clean 3-zone Top Bar */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-base font-semibold tracking-tight text-gray-900 whitespace-nowrap shrink-0"
          >
            Today&apos;s Outfit
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button
              type="button"
              onClick={() => setShowWardrobe(false)}
              className="hover:text-gray-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Generator
            </button>
            <button
              type="button"
              onClick={() => setShowWardrobe(true)}
              className="hover:text-gray-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Edit wardrobe
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!authReady ? (
              <span className="text-xs text-gray-400 whitespace-nowrap">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-gray-600 max-w-[160px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  disabled={authActionPending}
                  onClick={() => void signOut()}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={authActionPending}
                onClick={() => void signIn()}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{authActionPending ? 'Signing in...' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {authError && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 mt-4">
          <p className="text-xs text-red-600 text-center" role="alert">
            {authError}
          </p>
        </div>
      )}

      <main id="top" className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-4xl">
          {/* Page Intro & Weather Switch */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 text-balance">
              Today&apos;s Outfit
            </h1>
            <p className="mt-2 text-sm text-gray-500 tabular-nums">
              {shirts.length} shirts
              {isColdDay && (
                <>
                  <span aria-hidden="true" className="mx-2">·</span>
                  {uppers.length} uppers
                </>
              )}
              <span aria-hidden="true" className="mx-2">·</span>
              {trousers.length} trousers
              <span aria-hidden="true" className="mx-2">·</span>
              {activeComboCount} combinations
            </p>

            <div
              className="mt-5 inline-flex items-center p-1 bg-gray-200/75 rounded-xl"
              role="group"
              aria-label="Weather mode"
            >
              <button
                type="button"
                onClick={() => handleWeatherChange(false)}
                aria-pressed={!isColdDay}
                className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                  !isColdDay
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                <span>Regular</span>
              </button>
              <button
                type="button"
                onClick={() => handleWeatherChange(true)}
                aria-pressed={isColdDay}
                className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                  isColdDay
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Snowflake className="w-4 h-4" aria-hidden="true" />
                <span>Cold day</span>
              </button>
            </div>
          </div>

          {/* Main Outfit Card */}
          <section
            aria-label="Suggested outfit"
            className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10"
          >
            {loadingWardrobe ? (
              <div className="py-16 text-center text-sm text-gray-500">
                Loading your wardrobe...
              </div>
            ) : missingCategory ? (
              <div className="py-12 text-center">
                <p className="font-display text-lg font-medium text-gray-900">
                  Your wardrobe needs at least one item in each active category
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Add a shirt, trouser{isColdDay ? ', and upper' : ''} below to generate an outfit.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWardrobe(true)}
                  className="mt-6 inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Open wardrobe editor
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-1 items-center gap-6 sm:gap-6 ${
                    isColdDay
                      ? 'md:grid-cols-[1fr_auto_1fr_auto_1fr]'
                      : 'sm:grid-cols-[1fr_auto_1fr]'
                  }`}
                >
                  {/* Shirt */}
                  <div className="flex flex-col items-center text-center py-2">
                    <GarmentIllustration item={outfit.shirt} kind="shirt" />
                    <span className="mt-4 text-xs font-medium text-gray-400">
                      {isColdDay ? 'Shirt (base)' : 'Top'}
                    </span>
                    <p className="mt-1 font-display text-lg font-medium text-gray-900 leading-snug max-w-[20ch] text-balance">
                      {formatGarmentName(outfit.shirt)}
                    </p>
                  </div>

                  {isColdDay && (
                    <>
                      <div className="flex items-center justify-center" aria-hidden="true">
                        <div className="w-full h-px bg-gray-100 md:hidden" />
                        <span className="hidden md:inline-flex items-center justify-center w-8 h-8 text-xl font-normal text-gray-300 select-none">
                          +
                        </span>
                      </div>

                      {/* Upper */}
                      <div className="flex flex-col items-center text-center py-2">
                        <GarmentIllustration item={outfit.upper} kind="upper" />
                        <span className="mt-4 text-xs font-medium text-gray-400">
                          Upper (on top)
                        </span>
                        <p className="mt-1 font-display text-lg font-medium text-gray-900 leading-snug max-w-[20ch] text-balance">
                          {formatGarmentName(outfit.upper)}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Plus separator */}
                  <div className="flex items-center justify-center" aria-hidden="true">
                    <div
                      className={`w-full h-px bg-gray-100 ${isColdDay ? 'md:hidden' : 'sm:hidden'}`}
                    />
                    <span
                      className={`${
                        isColdDay ? 'hidden md:inline-flex' : 'hidden sm:inline-flex'
                      } items-center justify-center w-8 h-8 text-xl font-normal text-gray-300 select-none`}
                    >
                      +
                    </span>
                  </div>

                  {/* Trouser */}
                  <div className="flex flex-col items-center text-center py-2">
                    <GarmentIllustration item={outfit.trouser} kind="trouser" />
                    <span className="mt-4 text-xs font-medium text-gray-400">
                      Bottom
                    </span>
                    <p className="mt-1 font-display text-lg font-medium text-gray-900 leading-snug max-w-[20ch] text-balance">
                      {formatGarmentName(outfit.trouser)}
                    </p>
                  </div>
                </div>

                {/* Primary Action */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3 text-center">
                  <button
                    type="button"
                    onClick={handleNewOutfit}
                    className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>New Outfit</span>
                  </button>
                  <p className="text-xs text-gray-400">
                    {isColdDay
                      ? `${outfit.upper} over ${outfit.shirt} + ${outfit.trouser}`
                      : `${outfit.shirt} + ${outfit.trouser}`}
                  </p>
                  {usingFallback && (
                    <p className="text-xs text-amber-700">
                      No strict color-matched pairs available — showing an open combination.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Wardrobe Editor Toggle */}
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowWardrobe((prev) => !prev)}
              aria-expanded={showWardrobe}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <span>{showWardrobe ? 'Hide wardrobe' : 'Edit wardrobe'}</span>
              {showWardrobe ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {showWardrobe && (
              <WardrobePanel
                items={items}
                selectedShirt={outfit.shirt}
                selectedUpper={outfit.upper}
                selectedTrouser={outfit.trouser}
                isColdDay={isColdDay}
                isSignedIn={Boolean(user)}
                onSelectShirt={handlePickShirt}
                onSelectUpper={handlePickUpper}
                onSelectTrouser={handlePickTrouser}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onResetDefault={resetToDefault}
                onSignIn={signIn}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
