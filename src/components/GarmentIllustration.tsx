import { getGarmentVisual } from '../outfitData';

interface GarmentIllustrationProps {
  item: string;
  kind: 'shirt' | 'trouser' | 'upper';
}

export function GarmentIllustration({ item, kind }: GarmentIllustrationProps) {
  const visual = getGarmentVisual(item);
  const strokeColor = visual.isLight ? '#9CA3AF' : 'rgba(17, 24, 39, 0.25)';
  const detailStroke = visual.isLight ? '#9CA3AF' : 'rgba(255, 255, 255, 0.38)';

  if (kind === 'shirt') {
    return (
      <svg
        viewBox="0 0 120 112"
        className="w-24 h-24 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          {visual.secondaryColor && (
            <linearGradient id="splitShirt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="50%" stopColor={visual.primaryColor} />
              <stop offset="50%" stopColor={visual.secondaryColor} />
            </linearGradient>
          )}
        </defs>

        {visual.isLongSleeve ? (
          <path
            d="M42 18 L24 24 L8 68 L21 73 L32 45 L32 98 L88 98 L88 45 L99 73 L112 68 L96 24 L78 18 C73 25 47 25 42 18 Z"
            fill={visual.secondaryColor ? 'url(#splitShirt)' : visual.primaryColor}
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M42 18 L24 24 L11 47 L25 54 L33 41 L33 98 L87 98 L87 41 L95 54 L109 47 L96 24 L78 18 C73 25 47 25 42 18 Z"
            fill={visual.secondaryColor ? 'url(#splitShirt)' : visual.primaryColor}
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        )}

        {visual.isPolo ? (
          <>
            <path
              d="M42 18 L49 30 L60 25 L71 30 L78 18"
              stroke={detailStroke}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="60"
              y1="25"
              x2="60"
              y2="45"
              stroke={detailStroke}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <circle cx="60" cy="33" r="1.25" fill={detailStroke} />
            <circle cx="60" cy="40" r="1.25" fill={detailStroke} />
          </>
        ) : (
          <path
            d="M44 19 C49 27 71 27 76 19"
            stroke={detailStroke}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  if (kind === 'upper') {
    return (
      <svg
        viewBox="0 0 120 112"
        className="w-24 h-24 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        {/* Hood behind neckline */}
        {visual.upperStyle === 'hoodie' && (
          <path
            d="M40 20 C39 8 81 8 80 20"
            fill={visual.primaryColor}
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        )}

        {/* Outer body + full sleeves */}
        <path
          d="M41 19 L22 25 L6 70 L20 75 L31 46 L31 99 L89 99 L89 46 L100 75 L114 70 L98 25 L79 19 C73 27 47 27 41 19 Z"
          fill={visual.primaryColor}
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Ribbed hem */}
        <line
          x1="31"
          y1="91"
          x2="89"
          y2="91"
          stroke={detailStroke}
          strokeWidth="1.4"
        />

        {/* Hoodie details */}
        {visual.upperStyle === 'hoodie' && (
          <>
            <path
              d="M43 20 C49 28 71 28 77 20"
              stroke={detailStroke}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Drawstrings */}
            <line x1="54" y1="26" x2="54" y2="41" stroke={detailStroke} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="66" y1="26" x2="66" y2="41" stroke={detailStroke} strokeWidth="1.4" strokeLinecap="round" />
            {/* Zip or Kangaroo pocket */}
            {visual.hasZip ? (
              <line x1="60" y1="26" x2="60" y2="91" stroke={detailStroke} strokeWidth="1.5" />
            ) : (
              <path
                d="M42 86 L46 69 L74 69 L78 86"
                stroke={detailStroke}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </>
        )}

        {/* Sweater details */}
        {visual.upperStyle === 'sweater' && (
          <>
            <path
              d="M43 19 C49 28 71 28 77 19"
              stroke={detailStroke}
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            {visual.hasZip && (
              <line
                x1="60"
                y1="26"
                x2="60"
                y2="46"
                stroke={detailStroke}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </>
        )}

        {/* Jacket details */}
        {visual.upperStyle === 'jacket' && (
          <>
            <path
              d="M41 19 L49 29 L60 24 L71 29 L79 19"
              stroke={detailStroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="60" y1="24" x2="60" y2="91" stroke={detailStroke} strokeWidth="1.6" />
            <line x1="40" y1="70" x2="48" y2="82" stroke={detailStroke} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="80" y1="70" x2="72" y2="82" stroke={detailStroke} strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 112"
      className="w-24 h-24 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M36 14 L84 14 L88 100 L66 100 L60 48 L54 100 L32 100 Z"
        fill={visual.primaryColor}
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <line x1="36" y1="22" x2="84" y2="22" stroke={detailStroke} strokeWidth="1.5" />
      <line
        x1="60"
        y1="22"
        x2="60"
        y2="37"
        stroke={detailStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {visual.isCorduroy && (
        <g stroke={detailStroke} strokeWidth="0.9" strokeOpacity="0.6">
          <line x1="42" y1="26" x2="39" y2="96" />
          <line x1="48" y1="26" x2="46" y2="96" />
          <line x1="54" y1="26" x2="52" y2="96" />
          <line x1="66" y1="26" x2="68" y2="96" />
          <line x1="72" y1="26" x2="74" y2="96" />
          <line x1="78" y1="26" x2="81" y2="96" />
        </g>
      )}
    </svg>
  );
}
