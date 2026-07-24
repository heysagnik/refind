import Link from 'next/link';
import { Card, CardImage, CardBody } from '@/app/components/ui/Card';
import { CheckIcon } from '@/app/components/icons';
import { categoryLabels } from '@/lib/questions';

export interface CardItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  locationName: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: Date;
}

interface Props {
  item: CardItem;
  highlighted?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function ItemCard({ item, highlighted, onHoverStart, onHoverEnd }: Props) {
  const isResolved = item.status === 'claimed' || item.status === 'closed';

  return (
    <Link
      href={`/items/${item.id}`}
      className="block"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <Card
        className={`hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 ${
          highlighted ? 'shadow-elevated -translate-y-0.5 ring-2 ring-accent' : ''
        }`}
      >
        <div className="relative">
          {item.imageUrl && (
            <CardImage src={item.imageUrl} alt={item.title} className={isResolved ? 'grayscale-[15%] brightness-[0.96]' : ''} />
          )}
          <div className="absolute top-2.5 left-2.5">
            {isResolved ? (
              <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold bg-surface/90 text-success backdrop-blur-md shadow-floating">
                <CheckIcon className="w-3 h-3" />
                {item.status === 'claimed' ? 'Claimed' : 'Returned'}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-bold bg-surface/90 text-ink backdrop-blur-md shadow-floating">
                {categoryLabels[item.category] ?? item.category}
              </span>
            )}
          </div>
        </div>
        <CardBody>
          <h3 className={`font-bold text-[15px] truncate mb-0.5 ${isResolved ? 'text-ink-soft' : 'text-ink'}`}>
            {item.title}
          </h3>

          {item.description ? (
            <p className={`text-[13px] line-clamp-2 leading-relaxed ${isResolved ? 'text-ink-faint' : 'text-ink-soft'}`}>
              {item.description}
            </p>
          ) : (
            <p className="text-[13px] text-ink-faint">Tap to see details</p>
          )}

          {item.locationName && (
            <p className={`text-[12px] mt-2 truncate ${isResolved ? 'text-ink-faint' : 'text-ink-soft'}`}>
              📍 {item.locationName}
            </p>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}
