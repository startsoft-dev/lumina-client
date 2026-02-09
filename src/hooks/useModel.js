import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useOrganization } from './useOrganization';
import { extractPaginationFromHeaders } from '../lib/pagination';

/**
 * Helper to build query URL with filters, includes, etc.
 */
function buildQueryUrl(model, organization, options = {}) {
  if (!organization) {
    throw new Error('Organization slug is required');
  }
  
  // Ensure organization is a valid string (not null, undefined, or empty)
  const orgSlug = String(organization).trim();
  if (!orgSlug) {
    throw new Error('Organization slug is required and must be a non-empty string');
  }
  
  let url = `/${orgSlug}/${model}`;
  const params = new URLSearchParams();
  
  // Add filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      params.append(`filter[${key}]`, value);
    });
  }
  
  // Add includes
  if (options.includes && options.includes.length > 0) {
    params.append('include', options.includes.join(','));
  }
  
  // Add sorts
  if (options.sort) {
    params.append('sort', options.sort);
  }
  
  // Add fields
  if (options.fields && options.fields.length > 0) {
    params.append('fields', options.fields.join(','));
  }

  // Add search
  if (options.search) {
    params.append('search', options.search);
  }

  // Add pagination
  if (options.page) {
    params.append('page', options.page);
  }
  if (options.perPage || options.per_page) {
    params.append('per_page', options.perPage || options.per_page);
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Hook to fetch a list of models (index)
 * @param {string} model - Model name (e.g., 'users', 'posts')
 * @param {Object} options - Optional query options { filters, includes, sort, fields, search, page, perPage }
 * @returns {Object} React Query result with data (contains data and pagination), isLoading, error, refetch
 *
 * @example
 * // Simple usage
 * const { data: response } = useModelIndex('users');
 * const users = response?.data || [];
 *
 * // With query options and pagination
 * const { data: response } = useModelIndex('posts', {
 *   filters: { status: 'published' },
 *   includes: ['author', 'comments'],
 *   sort: '-created_at',
 *   fields: ['id', 'title', 'content'],
 *   search: 'react',
 *   page: 1,
 *   perPage: 20
 * });
 * const posts = response?.data || [];
 * const pagination = response?.pagination;
 */
export function useModelIndex(model, options = {}) {
  const organization = useOrganization();

  if (!organization) {
    return {
      data: null,
      pagination: null,
      isLoading: false,
      error: new Error('Organization slug is required'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }

  const url = buildQueryUrl(model, organization, options);

  return useQuery({
    queryKey: ['modelIndex', model, organization, options],
    queryFn: async () => {
      const response = await api.get(url);
      const pagination = extractPaginationFromHeaders(response);

      return {
        data: response.data,
        pagination,
      };
    },
    enabled: !!organization,
  });
}

/**
 * Hook to fetch a single model (show)
 * @param {string} model - Model name (e.g., 'users', 'posts')
 * @param {string|number} id - Resource ID
 * @param {Object} options - Optional query options { includes, fields }
 * @returns {Object} React Query result with data, isLoading, error, refetch
 * 
 * @example
 * // Simple usage
 * useModelShow('users', 1)
 * 
 * // With query options
 * useModelShow('posts', 1, {
 *   includes: ['author', 'comments'],
 *   fields: ['id', 'title', 'content']
 * })
 */
export function useModelShow(model, id, options = {}) {
  const organization = useOrganization();

  if (!organization) {
    return {
      data: null,
      isLoading: false,
      error: new Error('Organization slug is required'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }
  
  if (!id) {
    return {
      data: null,
      isLoading: false,
      error: new Error('ID is required for useModelShow'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }
  
  return useQuery({
    queryKey: ['modelShow', model, id, organization, options],
    queryFn: async () => {
      const orgSlug = String(organization).trim();
      if (!orgSlug) {
        throw new Error('Organization slug is required. Please ensure you are logged in and have selected an organization.');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (options.includes && options.includes.length > 0) {
        params.append('include', Array.isArray(options.includes) ? options.includes.join(',') : options.includes);
      }
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          params.append(`filter[${key}]`, value);
        });
      }
      if (options.sort) {
        params.append('sort', options.sort);
      }
      if (options.fields && options.fields.length > 0) {
        params.append('fields', Array.isArray(options.fields) ? options.fields.join(',') : options.fields);
      }

      // Construct final URL: /{organization}/{model}/{id}?queryParams
      const queryString = params.toString();
      const finalUrl = queryString
        ? `/${orgSlug}/${model}/${id}?${queryString}`
        : `/${orgSlug}/${model}/${id}`;

      const response = await api.get(finalUrl);
      return response.data;
    },
    enabled: !!organization && !!id && !!String(organization).trim(),
  });
}

/**
 * Hook to update a model
 * @param {string} model - Model name
 * @returns {Object} React Query mutation with mutate, mutateAsync, isLoading, error, isSuccess
 */
export function useModelUpdate(model) {
  const organization = useOrganization();
  const queryClient = useQueryClient();
  
  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }
  
  return useMutation({
    mutationFn: ({ id, data }) => {
      // Organization is already in the URL path, no need to add as query parameter or in body
      const url = `/${organization}/${model}/${id}`;
      
      return api.put(url, data).then((res) => res.data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['modelIndex', model] });
      queryClient.invalidateQueries({ queryKey: ['modelShow', model] });
    },
  });
}

/**
 * Hook to delete a model
 * @param {string} model - Model name
 * @returns {Object} React Query mutation with mutate, mutateAsync, isLoading, error, isSuccess
 */
export function useModelDelete(model) {
  const organization = useOrganization();
  const queryClient = useQueryClient();

  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }

  return useMutation({
    mutationFn: (id) => {
      // Organization is already in the URL path, no need to add as query parameter
      const url = `/${organization}/${model}/${id}`;

      return api.delete(url).then((res) => res.data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['modelIndex', model] });
      queryClient.invalidateQueries({ queryKey: ['modelShow', model] });
    },
  });
}

/**
 * Hook to create a new model
 * @param {string} model - Model name (e.g., 'users', 'posts')
 * @returns {Object} React Query mutation with mutate, mutateAsync, isPending, error, isSuccess
 *
 * @example
 * const createUser = useModelStore('users');
 *
 * createUser.mutate({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 */
export function useModelStore(model) {
  const organization = useOrganization();
  const queryClient = useQueryClient();

  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }

  return useMutation({
    mutationFn: (data) => {
      const url = `/${organization}/${model}`;
      return api.post(url, data).then((res) => res.data);
    },
    onSuccess: () => {
      // Invalidate related queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['modelIndex', model] });
      queryClient.invalidateQueries({ queryKey: ['modelShow', model] });
    },
  });
}

/**
 * Hook to fetch soft-deleted (trashed) models
 * @param {string} model - Model name (e.g., 'users', 'posts')
 * @param {Object} options - Optional query options { filters, includes, sort, fields, search, page, perPage }
 * @returns {Object} React Query result with data (contains data and pagination), isLoading, error, refetch
 *
 * @example
 * // Simple usage
 * const { data: response } = useModelTrashed('users');
 * const trashedUsers = response?.data || [];
 *
 * // With pagination and search
 * const { data: response } = useModelTrashed('posts', {
 *   search: 'deleted',
 *   page: 1,
 *   perPage: 20,
 *   sort: '-deleted_at'
 * });
 * const trashedPosts = response?.data || [];
 * const pagination = response?.pagination;
 */
export function useModelTrashed(model, options = {}) {
  const organization = useOrganization();

  if (!organization) {
    return {
      data: null,
      pagination: null,
      isLoading: false,
      error: new Error('Organization slug is required'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }

  return useQuery({
    queryKey: ['modelTrashed', model, organization, options],
    queryFn: async () => {
      // Build URL manually for trashed endpoint
      const orgSlug = String(organization).trim();
      let url = `/${orgSlug}/${model}/trashed`;
      const params = new URLSearchParams();

      // Add all query parameters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          params.append(`filter[${key}]`, value);
        });
      }
      if (options.includes && options.includes.length > 0) {
        params.append('include', options.includes.join(','));
      }
      if (options.sort) {
        params.append('sort', options.sort);
      }
      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','));
      }
      if (options.search) {
        params.append('search', options.search);
      }
      if (options.page) {
        params.append('page', options.page);
      }
      if (options.perPage || options.per_page) {
        params.append('per_page', options.perPage || options.per_page);
      }

      const queryString = params.toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;

      const response = await api.get(finalUrl);
      const pagination = extractPaginationFromHeaders(response);

      return {
        data: response.data,
        pagination,
      };
    },
    enabled: !!organization,
  });
}

/**
 * Hook to restore a soft-deleted model
 * @param {string} model - Model name
 * @returns {Object} React Query mutation with mutate, mutateAsync, isPending, error, isSuccess
 *
 * @example
 * const restoreUser = useModelRestore('users');
 *
 * restoreUser.mutate(userId);
 */
export function useModelRestore(model) {
  const organization = useOrganization();
  const queryClient = useQueryClient();

  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }

  return useMutation({
    mutationFn: (id) => {
      const url = `/${organization}/${model}/${id}/restore`;
      return api.post(url).then((res) => res.data);
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['modelIndex', model] });
      queryClient.invalidateQueries({ queryKey: ['modelTrashed', model] });
      queryClient.invalidateQueries({ queryKey: ['modelShow', model] });
    },
  });
}

/**
 * Hook to permanently delete a model (force delete)
 * @param {string} model - Model name
 * @returns {Object} React Query mutation with mutate, mutateAsync, isPending, error, isSuccess
 *
 * @example
 * const forceDeleteUser = useModelForceDelete('users');
 *
 * forceDeleteUser.mutate(userId);
 */
export function useModelForceDelete(model) {
  const organization = useOrganization();
  const queryClient = useQueryClient();

  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }

  return useMutation({
    mutationFn: (id) => {
      const url = `/${organization}/${model}/${id}/force-delete`;
      return api.delete(url).then((res) => res.data);
    },
    onSuccess: () => {
      // Invalidate trashed queries
      queryClient.invalidateQueries({ queryKey: ['modelTrashed', model] });
    },
  });
}

/**
 * Hook to perform nested operations (multi-model transactions)
 * @returns {Object} React Query mutation with mutate, mutateAsync, isPending, error, isSuccess
 *
 * @example
 * const nestedOps = useNestedOperations();
 *
 * nestedOps.mutate({
 *   operations: [
 *     { action: 'create', model: 'blogs', data: { title: 'My Blog' } },
 *     { action: 'update', model: 'posts', id: 1, data: { title: 'Updated' } },
 *     { action: 'create', model: 'posts', data: { title: 'New Post', blog_id: '$0.id' } }
 *   ]
 * });
 */
export function useNestedOperations() {
  const organization = useOrganization();
  const queryClient = useQueryClient();

  if (!organization) {
    throw new Error('Organization slug is required. All routes must include organization in the URL (e.g., /org-slug/dashboard)');
  }

  return useMutation({
    mutationFn: ({ operations }) => {
      const url = `/${organization}/nested-operations`;
      return api.post(url, { operations }).then((res) => res.data);
    },
    onSuccess: (data, variables) => {
      // Invalidate queries for all affected models
      const affectedModels = new Set(
        variables.operations.map(op => op.model)
      );

      affectedModels.forEach(model => {
        queryClient.invalidateQueries({ queryKey: ['modelIndex', model] });
        queryClient.invalidateQueries({ queryKey: ['modelShow', model] });
      });
    },
  });
}

/**
 * Hook to fetch audit logs for a model instance
 * Note: Requires backend to implement GET /{org}/{model}/{id}/audit endpoint
 * @param {string} model - Model name
 * @param {string|number} id - Resource ID
 * @param {Object} options - Optional query options { page, perPage }
 * @returns {Object} React Query result with data (contains data and pagination), isLoading, error, refetch
 *
 * @example
 * const { data: response } = useModelAudit('users', 1, { page: 1, perPage: 50 });
 * const auditLogs = response?.data || [];
 * const pagination = response?.pagination;
 */
export function useModelAudit(model, id, options = {}) {
  const organization = useOrganization();

  if (!organization) {
    return {
      data: null,
      pagination: null,
      isLoading: false,
      error: new Error('Organization slug is required'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }

  if (!id) {
    return {
      data: null,
      pagination: null,
      isLoading: false,
      error: new Error('ID is required for useModelAudit'),
      isError: true,
      refetch: () => Promise.resolve({ data: null }),
    };
  }

  return useQuery({
    queryKey: ['modelAudit', model, id, organization, options],
    queryFn: async () => {
      const orgSlug = String(organization).trim();
      let url = `/${orgSlug}/${model}/${id}/audit`;
      const params = new URLSearchParams();

      if (options.page) {
        params.append('page', options.page);
      }
      if (options.perPage || options.per_page) {
        params.append('per_page', options.perPage || options.per_page);
      }

      const queryString = params.toString();
      const finalUrl = queryString ? `${url}?${queryString}` : url;

      const response = await api.get(finalUrl);
      const pagination = extractPaginationFromHeaders(response);

      return {
        data: response.data,
        pagination,
      };
    },
    enabled: !!organization && !!id,
  });
}
