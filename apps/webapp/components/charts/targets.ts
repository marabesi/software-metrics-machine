export interface TargetDefinition {
  target: string;
  description: string;
  source?: string;
}

export const METRIC_TARGETS: Record<string, TargetDefinition> = {
  'pairing-index': {
    target: '> 30%',
    description: 'Higher paired commit percentage correlates with better knowledge sharing and bus factor resilience.',
    source: 'Cockburn & Williams (2001), Pair Programming Illuminated; Hannay et al. (2009) IEEE TSE meta-analysis',
  },
  'deployment-frequency': {
    target: 'Daily (Elite)',
    description: 'Elite deployments (multiple/day) are the top DORA benchmark for delivery performance.',
    source: 'Forsgren, Humble & Kim (2018), Accelerate: The Science of Lean Software and DevOps; DORA State of DevOps Report',
  },
  'pipeline-duration': {
    target: '< 10 min',
    description: 'Fast CI feedback is critical for developer productivity. Under 10 min correlates with elite delivery performance.',
    source: 'Forsgren et al. (2018), Accelerate — lead time < 1 hour for Elite; Vasilescu et al. (2015) ESEC/FSE on CI outcomes',
  },
  'job-avg-time': {
    target: '< 5 min',
    description: 'Individual jobs should complete quickly to keep total pipeline under 10 minutes.',
    source: 'Derived from DORA lead-time benchmarks (Forsgren et al., 2018); Hilton et al. (2016) ICSE on CI usage',
  },
  'job-reruns': {
    target: '0 reruns',
    description: 'Reruns waste compute time and erode CI trust. Flaky tests are a primary cause.',
    source: 'Eck et al. (2019) Empirical Software Engineering — flaky tests impact on CI; Luo et al. (2014) ICSE on flaky test causes',
  },
  'jobs-success-rate': {
    target: '> 90%',
    description: 'A high success rate indicates stable pipelines. This maps to DORA low change failure rate.',
    source: 'Forsgren et al. (2018), Accelerate — Elite: change failure rate < 5% (i.e. success > 95%); DORA 2021 report',
  },
  'average-review-time': {
    target: '< 24 hours',
    description: 'Elite teams review PRs within 24 hours. Longer times create delivery bottlenecks.',
    source: 'Forsgren et al. (2018), Accelerate — lead time for code review; Bacchelli & Bird (2013) ICSE on modern code review',
  },
  'time-to-first-comment': {
    target: '< 4 hours',
    description: 'Quick first responses keep PR momentum. Delays reduce author productivity.',
    source: 'Beller et al. (2014) MSR — first response time impact in modern code review; Bacchelli & Bird (2013) ICSE',
  },
  'prs-by-author': {
    target: 'Balanced distribution',
    description: 'Over-reliance on a few authors creates bus-factor risk. Balanced contributions improve resilience.',
    source: 'Avelino et al. (2016) J. Brazilian Comp. Soc. — truck factor analysis of GitHub projects; Bird et al. (2011) FSE — ownership and defects',
  },
  'prs-remain-open': {
    target: '< 3 days',
    description: 'PRs open beyond 3 days slow delivery and increase merge conflicts.',
    source: 'Gousios et al. (2015) ICSE — pull-based development practices; Yu et al. (2015) ICSE — review latency effects',
  },
  'pr-statistics': {
    target: 'High merge rate',
    description: 'A healthy process merges most PRs with constructive discussion. Stalled PRs signal process issues.',
    source: 'Gousios et al. (2015) ICSE — integrator perspective on pull-based dev; Sadowski et al. (2018) ICSE SEIP — Google code review study',
  },
  'most-commented-prs': {
    target: 'Monitor outliers',
    description: 'Excessive comments may indicate unclear requirements or scope creep. Moderate discussion is healthy.',
    source: 'Bacchelli & Bird (2013) ICSE — expectations and challenges of modern code review; Bosu et al. (2015) HICSS review quality',
  },
  'comments-by-author': {
    target: 'Inclusive participation',
    description: 'Code review should be a team-wide practice, not concentrated on one person.',
    source: 'Sadowski et al. (2018) ICSE SEIP — Google code review culture; Rigby et al. (2008) ICSE — open source review patterns',
  },
  'open-prs-through-time': {
    target: 'Opened ≈ Closed',
    description: 'A growing gap between opened and closed PRs signals review bottlenecks.',
    source: 'Gousios et al. (2015) ICSE — pull request dynamics; Vasilescu et al. (2015) ESEC/FSE — CI and quality outcomes',
  },
  'code-churn': {
    target: 'Consistent, moderate churn',
    description: 'Stable churn rates indicate healthy evolution. Sudden spikes precede defect density increases.',
    source: 'Nagappan & Ball (2005) ICSE — relative code churn as defect predictor; Hassan (2009) ICSE — complexity of code changes',
  },
  'entity-churn': {
    target: 'Monitor hotspots',
    description: 'Files with extreme churn are defect-prone hotspots needing refactoring.',
    source: 'Zimmermann et al. (2007) ICSE — predicting defects from dependency networks; Eaddy et al. (2008) IEEE TSE — defects and concern distribution',
  },
  'entity-effort': {
    target: 'Distributed effort',
    description: 'Effort concentrated in a few files increases maintenance risk and defect density.',
    source: 'Hassan (2009) ICSE — fault prediction using code change complexity; Mockus & Herbsleb (2002) ICSE — expertise and ownership',
  },
  'ownership': {
    target: 'Shared ownership (< 80% single owner)',
    description: 'Files owned > 80% by one person are bus-factor risks. Shared ownership reduces defects.',
    source: 'Bird et al. (2011) FSE — ownership and software quality; Greiler et al. (2015) ICSE — knowledge loss in software teams',
  },
  'code-coupling': {
    target: '< 30% degree',
    description: 'Highly coupled components require coordinated changes, increasing maintenance cost and defect risk.',
    source: 'Yourdon & Constantine (1979), Structured Design — coupling principles; El Emam et al. (2001) JSS — OO metrics validation',
  },
  'sonarqube-reliability': {
    target: 'A (Rating 1)',
    description: 'Rating A means zero bugs. Each bug escalates quality debt and risk.',
    source: 'SQALE method — Letouzey & Coq (2010) ACM MTD Workshop; ISO/IEC 25010 quality model (based on ISO 9126)',
  },
  'sonarqube-security': {
    target: 'A (Rating 1)',
    description: 'Security issues must be fixed with highest priority. Rating A means no vulnerabilities.',
    source: 'OWASP Top 10 vulnerabilities methodology; SQALE method — Letouzey & Coq (2010) ACM MTD Workshop',
  },
  'sonarqube-maintainability': {
    target: 'A (Rating 1)',
    description: 'Low technical debt ensures sustainable development pace.',
    source: 'SQALE method — Letouzey & Coq (2010) ACM MTD Workshop; ISO/IEC 25010 maintainability model',
  },
  'sonarqube-duplication': {
    target: '< 3%',
    description: 'Duplication increases maintenance costs — each change must be replicated.',
    source: 'Juergens et al. (2009) ICSE — do code clones matter?; Roy et al. (2009) Sci. Comp. Prog. — clone detection evaluation',
  },
  'sonarqube-coverage': {
    target: '> 80%',
    description: 'Higher test coverage reduces post-release defect density significantly.',
    source: 'Nagappan, Ball & Murphy (2009) MSR Tech Report — coverage and defects; El Emam et al. (2001) JSS — OO metrics',
  },
  'sonarqube-complexity': {
    target: '< 15 per component',
    description: 'McCabe cyclomatic complexity < 15 is the widely accepted threshold. Higher values impede testability.',
    source: 'McCabe (1976) IEEE TSE — complexity measure; Basili et al. (1995) IEEE TSE — OO metrics validation; McConnell (2004) Code Complete',
  },
  'sonarqube-measurements': {
    target: 'Improving trends',
    description: 'Monitoring metric trends reveals emerging technical debt before it becomes critical.',
    source: 'SQALE method — Letouzey & Coq (2010) ACM MTD Workshop; Fowler (1999), Refactoring: principles for code health',
  },
};
