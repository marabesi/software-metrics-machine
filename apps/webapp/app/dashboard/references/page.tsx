'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { METRIC_TARGETS, type TargetDefinition, type SourceEntry } from '@/components/charts/targets';

interface MetricCategory {
  label: string;
  metrics: { key: string; definition: TargetDefinition }[];
}

const CATEGORIES: MetricCategory[] = [
  {
    label: 'Code Analysis',
    metrics: [
      { key: 'pairing-index', definition: METRIC_TARGETS['pairing-index'] },
      { key: 'code-churn', definition: METRIC_TARGETS['code-churn'] },
      { key: 'entity-churn', definition: METRIC_TARGETS['entity-churn'] },
      { key: 'entity-effort', definition: METRIC_TARGETS['entity-effort'] },
      { key: 'ownership', definition: METRIC_TARGETS['ownership'] },
      { key: 'code-coupling', definition: METRIC_TARGETS['code-coupling'] },
      { key: 'big-o-classification', definition: METRIC_TARGETS['big-o-classification'] },
    ],
  },
  {
    label: 'Pipelines',
    metrics: [
      { key: 'deployment-frequency', definition: METRIC_TARGETS['deployment-frequency'] },
      { key: 'pipeline-duration', definition: METRIC_TARGETS['pipeline-duration'] },
      { key: 'job-avg-time', definition: METRIC_TARGETS['job-avg-time'] },
      { key: 'job-reruns', definition: METRIC_TARGETS['job-reruns'] },
      { key: 'jobs-success-rate', definition: METRIC_TARGETS['jobs-success-rate'] },
    ],
  },
  {
    label: 'Pull Requests',
    metrics: [
      { key: 'average-review-time', definition: METRIC_TARGETS['average-review-time'] },
      { key: 'time-to-first-comment', definition: METRIC_TARGETS['time-to-first-comment'] },
      { key: 'prs-by-author', definition: METRIC_TARGETS['prs-by-author'] },
      { key: 'prs-remain-open', definition: METRIC_TARGETS['prs-remain-open'] },
      { key: 'pr-statistics', definition: METRIC_TARGETS['pr-statistics'] },
      { key: 'most-commented-prs', definition: METRIC_TARGETS['most-commented-prs'] },
      { key: 'comments-by-author', definition: METRIC_TARGETS['comments-by-author'] },
      { key: 'open-prs-through-time', definition: METRIC_TARGETS['open-prs-through-time'] },
    ],
  },
  {
    label: 'SonarQube',
    metrics: [
      { key: 'sonarqube-reliability', definition: METRIC_TARGETS['sonarqube-reliability'] },
      { key: 'sonarqube-security', definition: METRIC_TARGETS['sonarqube-security'] },
      { key: 'sonarqube-maintainability', definition: METRIC_TARGETS['sonarqube-maintainability'] },
      { key: 'sonarqube-duplication', definition: METRIC_TARGETS['sonarqube-duplication'] },
      { key: 'sonarqube-coverage', definition: METRIC_TARGETS['sonarqube-coverage'] },
      { key: 'sonarqube-complexity', definition: METRIC_TARGETS['sonarqube-complexity'] },
      { key: 'sonarqube-measurements', definition: METRIC_TARGETS['sonarqube-measurements'] },
    ],
  },
];

function formatMetricName(key: string): string {
  return key
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SourceList({ sources }: { sources: SourceEntry[] }) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Sources
      </Typography>
      <Box component="ul" sx={{ mt: 0.5, pl: 2, listStyleType: 'none' }}>
        {sources.map((source, idx) => (
          <Box component="li" key={idx} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
            <Link
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: '0.875rem',
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
                lineHeight: 1.5,
              }}
            >
              {source.label}
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MetricCard({ metric }: { metric: { key: string; definition: TargetDefinition } }) {
  const [expanded, setExpanded] = useState(false);
  const { definition } = metric;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardHeader
        title={
          definition.sources.length > 0 ? (
            <Box
              component="button"
              onClick={() => setExpanded(!expanded)}
              sx={{
                background: 'none',
                border: 'none',
                p: 0,
                m: 0,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'inherit',
                fontFamily: 'inherit',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
              aria-label={expanded ? 'collapse sources' : 'expand sources'}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                {formatMetricName(metric.key)}
              </Typography>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          ) : (
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {formatMetricName(metric.key)}
            </Typography>
          )
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
        <Chip
          label={definition.target}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mb: 1, fontWeight: 500 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {definition.description}
        </Typography>
        {definition.sources.length > 0 && (
          <Collapse in={expanded} timeout="auto">
            <SourceList sources={definition.sources} />
          </Collapse>
        )}
        {!expanded && definition.sources.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            {definition.sources.length} source{definition.sources.length !== 1 ? 's' : ''} available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function CategorySection({ category }: { category: MetricCategory }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: 'text.primary',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1,
        }}
      >
        {category.label}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {category.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </Box>
    </Box>
  );
}

export default function ReferencesPage() {
  const totalSources = Object.values(METRIC_TARGETS).reduce(
    (acc, def) => acc + def.sources.length,
    0
  );

  return (
    <div className="space-y-6">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          References & Sources
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          All academic papers, industry reports, and books used to define metric targets and
          recommendations across the dashboard. Each metric&apos;s target value is backed by
          published research on software engineering best practices.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Chip
            label={`${Object.keys(METRIC_TARGETS).length} metrics`}
            color="primary"
            variant="filled"
          />
          <Chip
            label={`${totalSources} sources`}
            color="secondary"
            variant="filled"
          />
        </Box>
      </Box>

      {CATEGORIES.map((category) => (
        <CategorySection key={category.label} category={category} />
      ))}
    </div>
  );
}
