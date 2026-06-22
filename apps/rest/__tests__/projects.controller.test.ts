import { describe, expect, it, vi } from 'vitest';
import { ProjectsController } from '../src/controllers/projects.controller';

describe('ProjectsController', () => {
  function createController(projects: Array<{ github_repository?: string }>) {
    const configRepo = {
      getAllProjects: vi.fn().mockReturnValue(projects),
    };
    const controller = new ProjectsController(configRepo as never);

    return { controller, configRepo };
  }

  it('maps multiple projects to their github_repository field', () => {
    const { controller } = createController([
      { github_repository: 'org/repo-one' },
      { github_repository: 'org/repo-two' },
    ]);

    const result = controller.getProjects();

    expect(result).toEqual({
      result: [{ github_repository: 'org/repo-one' }, { github_repository: 'org/repo-two' }],
    });
  });

  it('falls back to an empty string when github_repository is missing', () => {
    const { controller } = createController([{ github_repository: undefined }]);

    const result = controller.getProjects();

    expect(result).toEqual({ result: [{ github_repository: '' }] });
  });

  it('returns an empty result when there are no projects', () => {
    const { controller } = createController([]);

    const result = controller.getProjects();

    expect(result).toEqual({ result: [] });
  });
});
