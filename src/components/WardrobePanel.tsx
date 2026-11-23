import { useState, type FormEvent } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  type ClothingCategory,
  formatGarmentName,
  getGarmentVisual,
  WARDROBE_ITEM_NAME_MAX_LENGTH,
  type WardrobeItemRecord,
} from '../outfitData';

interface WardrobePanelProps {
  items: WardrobeItemRecord[];
  selectedShirt: string;
  selectedUpper: string;
  selectedTrouser: string;
  isColdDay: boolean;
  isSignedIn: boolean;
  onSelectShirt: (name: string) => void;
  onSelectUpper: (name: string) => void;
  onSelectTrouser: (name: string) => void;
  onAddItem: (category: ClothingCategory, name: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onResetDefault: () => Promise<void>;
  onSignIn: () => Promise<void>;
}

interface CategoryColumnProps {
  category: ClothingCategory;
  title: string;
  placeholder: string;
  items: WardrobeItemRecord[];
  selectedName: string | null;
  onSelect: (name: string) => void;
  onAddItem: (category: ClothingCategory, name: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveItem: (itemId: string) => Promise<void>;
}

function CategoryColumn({
  category,
  title,
  placeholder,
  items,
  selectedName,
  onSelect,
  onAddItem,
  onRemoveItem,
}: CategoryColumnProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onAddItem(category, draft);
    setSubmitting(false);
    if (result.ok) {
      setDraft('');
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h2 className="font-display text-sm font-semibold text-gray-900 tabular-nums">
          {title} ({items.length})
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            maxLength={WARDROBE_ITEM_NAME_MAX_LENGTH}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full min-h-[40px] px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-400 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !draft.trim()}
            aria-label={`Add to ${title}`}
            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>

      {items.length === 0 ? (
        <p className="mt-4 text-xs text-gray-400 py-3">
          No items yet. Add one above.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {items.map((item) => {
            const visual = getGarmentVisual(item.name);
            const isSelected = selectedName === item.name;
            return (
              <li key={item.id} className="flex items-center justify-between gap-2 py-1">
                <button
                  type="button"
                  onClick={() => onSelect(item.name)}
                  className={`flex-1 min-w-0 flex items-center gap-3 min-h-[40px] px-2 -ml-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-gray-900 font-medium bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-gray-300"
                    style={{
                      background: visual.secondaryColor
                        ? `linear-gradient(135deg, ${visual.primaryColor} 50%, ${visual.secondaryColor} 50%)`
                        : visual.primaryColor,
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{formatGarmentName(item.name)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function WardrobePanel({
  items,
  selectedShirt,
  selectedUpper,
  selectedTrouser,
  isColdDay,
  isSignedIn,
  onSelectShirt,
  onSelectUpper,
  onSelectTrouser,
  onAddItem,
  onRemoveItem,
  onResetDefault,
  onSignIn,
}: WardrobePanelProps) {
  const [resetting, setResetting] = useState(false);

  const shirts = items.filter((i) => i.category === 'shirt');
  const uppers = items.filter((i) => i.category === 'upper');
  const trousers = items.filter((i) => i.category === 'trouser');

  const handleReset = async () => {
    setResetting(true);
    await onResetDefault();
    setResetting(false);
  };

  return (
    <section
      id="wardrobe"
      aria-label="Wardrobe editor"
      className="mt-4 w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 mb-6 border-b border-gray-100">
        <div>
          <h2 className="font-display text-base font-semibold text-gray-900">
            Your Wardrobe
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {isSignedIn
              ? 'Changes save automatically to your account.'
              : 'Sign in with Google to save your custom wardrobe across sessions.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isSignedIn && (
            <button
              type="button"
              onClick={() => void onSignIn()}
              className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign in to save
            </button>
          )}
          <button
            type="button"
            disabled={resetting}
            onClick={() => void handleReset()}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{resetting ? 'Resetting...' : 'Reset starter'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <CategoryColumn
          category="shirt"
          title="Shirts"
          placeholder="Add shirt (e.g. beige linen shirt)"
          items={shirts}
          selectedName={selectedShirt}
          onSelect={onSelectShirt}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />

        <CategoryColumn
          category="upper"
          title="Uppers & Sweaters"
          placeholder="Add upper (e.g. grey cardigan)"
          items={uppers}
          selectedName={isColdDay ? selectedUpper : null}
          onSelect={onSelectUpper}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />

        <CategoryColumn
          category="trouser"
          title="Trousers"
          placeholder="Add trouser (e.g. olive chinos)"
          items={trousers}
          selectedName={selectedTrouser}
          onSelect={onSelectTrouser}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />
      </div>
    </section>
  );
}
