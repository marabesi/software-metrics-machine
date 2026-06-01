import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SonarqubeStatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-4xl font-bold" style={{ color }}>{value}</span>
      </CardContent>
    </Card>
  );
}
