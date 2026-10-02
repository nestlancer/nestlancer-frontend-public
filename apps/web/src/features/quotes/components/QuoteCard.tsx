import type { Quote } from '@nestlancer/types';
import { Card, CardContent, CardHeader, CardTitle } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

export function QuoteCard({ quote }: { quote: Quote }) {
  const amount = typeof quote.totalAmount === 'number' ? quote.totalAmount : quote.amount;
  const heading =
    (typeof quote.requestTitle === 'string' && quote.requestTitle.trim()) ||
    (typeof quote.title === 'string' && quote.title.trim()) ||
    'Untitled request';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-lg font-semibold tabular-nums">
          {formatMoneyFromPaise(amount, quote.currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{quote.status}</p>
      </CardContent>
    </Card>
  );
}
