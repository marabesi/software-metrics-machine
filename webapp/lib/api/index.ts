export { sourceCodeAPI } from './sourceCode';
export { pipelineAPI } from './pipeline';
export { pullRequestAPI } from './pullRequest';
export { fetchAPI, type ApiParams } from './client';

export default {
  sourceCodeAPI: () => import('./sourceCode').then(m => m.sourceCodeAPI),
  pipelineAPI: () => import('./pipeline').then(m => m.pipelineAPI),
  pullRequestAPI: () => import('./pullRequest').then(m => m.pullRequestAPI),
};
