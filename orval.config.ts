import { defineConfig } from 'orval';

const sharedInput = './swagger-docs/openapi-gateway.json';
const sharedSchemas = './packages/api-client/src/generated/models';
const sharedMutator = {
  path: './packages/api-client/src/orval-mutator.ts',
  name: 'customInstance',
} as const;

/** Tags with generated TanStack Query hooks — primary API surface for apps. */
const REACT_QUERY_TAGS = [
  'auth',
  'blog',
  'requests',
  'users',
  'projects',
  'quotes',
  'payments',
  'notifications',
  'messages',
  'media',
  'portfolio',
  'admin',
  'progress',
  'contact',
] as const;

function reactQueryOutput(target: string) {
  return {
    mode: 'tags-split' as const,
    target,
    schemas: sharedSchemas,
    client: 'react-query' as const,
    clean: false,
    prettier: true,
    override: {
      mutator: sharedMutator,
      query: {
        useQuery: true,
        useMutation: true,
      },
    },
  };
}

const reactQueryConfigs = Object.fromEntries(
  REACT_QUERY_TAGS.map((tag) => [
    `nestlancerReactQuery${tag.charAt(0).toUpperCase()}${tag.slice(1)}`,
    {
      input: {
        target: sharedInput,
        filters: { tags: [tag] },
      },
      output: reactQueryOutput('./packages/api-client/src/generated/react-query/endpoints.ts'),
    },
  ])
);

export default defineConfig({
  nestlancer: {
    input: sharedInput,
    output: {
      mode: 'tags-split',
      target: './packages/api-client/src/generated/endpoints.ts',
      schemas: sharedSchemas,
      client: 'axios',
      clean: true,
      prettier: true,
      override: {
        mutator: sharedMutator,
      },
    },
  },
  ...reactQueryConfigs,
});
