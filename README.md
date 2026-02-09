# @startsoft/lumina

> A comprehensive React library for Laravel backend applications with full CRUD, pagination, soft deletes, and multi-tenant support.

[![npm version](https://badge.fury.io/js/@rhino%2Fclient.svg)](https://www.npmjs.com/package/@startsoft/lumina)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🔐 **Authentication** - Built-in auth hooks with Laravel Sanctum support
- 🏢 **Multi-tenancy** - Organization-based routing and data scoping
- 📊 **Complete CRUD** - Index, show, create, update, delete operations
- 🗑️ **Soft Deletes** - Trash, restore, and force delete support
- 🔍 **Advanced Querying** - Search, filters, sorting, field selection, pagination
- 🔗 **Relationships** - Eager loading with includes
- 🔄 **Nested Operations** - Multi-model transactions
- 📝 **Audit Trails** - Track changes and history
- ⚡ **React Query** - Built on TanStack Query for caching and state management
- 📘 **TypeScript** - Full TypeScript support with type definitions

---

## 📦 Installation

```bash
npm install @startsoft/lumina
# or
yarn add @startsoft/lumina
# or
pnpm add @startsoft/lumina
```

---

## 🚀 Quick Start

```tsx
import { useModelIndex, useModelStore } from '@startsoft/lumina';

function PostsList() {
  // Fetch posts with pagination
  const { data: response, isLoading } = useModelIndex('posts', {
    page: 1,
    perPage: 20,
    search: 'react',
    includes: ['author'],
    sort: '-created_at'
  });

  const posts = response?.data || [];
  const pagination = response?.pagination;

  // Create new post
  const createPost = useModelStore('posts');

  const handleCreate = () => {
    createPost.mutate({
      title: 'My Post',
      content: 'Post content'
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Post</button>

      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          {post.author && <p>By: {post.author.name}</p>}
        </div>
      ))}

      {pagination && (
        <div>
          Page {pagination.currentPage} of {pagination.lastPage}
        </div>
      )}
    </div>
  );
}
```

---

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Installation and setup
- **[API Reference](./docs/API.md)** - Complete hook documentation
- **[Features Guide](./docs/features/)** - Detailed feature explanations
  - [Pagination](./docs/features/pagination.md)
  - [Soft Deletes](./docs/features/soft-deletes.md)
  - [Filtering & Search](./docs/features/filtering.md)
  - [Relationships](./docs/features/relationships.md)
  - [Nested Operations](./docs/features/nested-operations.md)
- **[Examples](./docs/examples/)** - Real-world usage examples

---

## 🎯 Core Hooks

### CRUD Operations

| Hook | Purpose |
|------|---------|
| `useModelIndex` | Fetch list of models with pagination, filtering, search |
| `useModelShow` | Fetch single model by ID |
| `useModelStore` | Create new model |
| `useModelUpdate` | Update existing model |
| `useModelDelete` | Soft delete model |

### Soft Deletes

| Hook | Purpose |
|------|---------|
| `useModelTrashed` | Fetch soft-deleted models |
| `useModelRestore` | Restore soft-deleted model |
| `useModelForceDelete` | Permanently delete model |

### Advanced Features

| Hook | Purpose |
|------|---------|
| `useNestedOperations` | Multi-model transactions |
| `useModelAudit` | Fetch audit trail for a model |

### Authentication & Organization

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state and methods |
| `useOrganization` | Current organization slug |
| `useOwner` | Organization data |
| `useOrganizationExists` | Validate organization |

### Invitations

| Hook | Purpose |
|------|---------|
| `useInvitations` | List invitations |
| `useInviteUser` | Create invitation |
| `useResendInvitation` | Resend invitation |
| `useCancelInvitation` | Cancel invitation |
| `useAcceptInvitation` | Accept invitation |

**[View complete API reference →](./docs/API.md)**

---

## 🏗️ Architecture

Built with modern technologies:

- **React 19** - Latest React features and performance
- **TanStack Query 5** - Powerful data fetching and caching
- **Axios** - HTTP client with interceptors
- **TypeScript** - Full type safety

### Design Principles

- **Composable** - Small, focused hooks that work together
- **Type-Safe** - Full TypeScript support with IntelliSense
- **Cached** - Automatic caching and background refetching
- **Optimized** - Only re-renders when data changes
- **Laravel-First** - Designed specifically for Laravel backends

---

## 💡 Key Features

### Pagination

Automatic pagination metadata extraction from Laravel response headers:

```tsx
const { data: response } = useModelIndex('posts', {
  page: 2,
  perPage: 20
});

const posts = response?.data || [];
const pagination = response?.pagination;
// { currentPage: 2, lastPage: 10, perPage: 20, total: 195 }
```

### Filtering & Search

Powerful query building with filters and full-text search:

```tsx
const { data: response } = useModelIndex('posts', {
  search: 'react hooks',
  filters: {
    status: 'published',
    category: 'tech'
  },
  sort: '-created_at'
});
```

### Relationships

Eager load related data with includes:

```tsx
const { data: post } = useModelShow('posts', 123, {
  includes: ['author', 'comments', 'tags']
});
```

### Soft Deletes

Complete soft delete workflow:

```tsx
const deletePost = useModelDelete('posts');
const trashedPosts = useModelTrashed('posts');
const restore = useModelRestore('posts');
const forceDelete = useModelForceDelete('posts');

// Soft delete
deletePost.mutate(postId);

// Restore
restore.mutate(postId);

// Permanently delete
forceDelete.mutate(postId);
```

### Nested Operations

Execute multiple operations in a single transaction:

```tsx
const nestedOps = useNestedOperations();

nestedOps.mutate({
  operations: [
    {
      action: 'create',
      model: 'blogs',
      data: { title: 'My Blog' }
    },
    {
      action: 'create',
      model: 'posts',
      data: {
        title: 'First Post',
        blog_id: '$0.id' // Reference first operation's result
      }
    }
  ]
});
```

---

## 🔧 Requirements

- **React:** 18.0.0 or higher
- **Node.js:** 18.0.0 or higher
- **Laravel Backend:** with [laravel-global-controller](https://github.com/yourusername/laravel-global-controller) package

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rhino-client.git
cd rhino-client

# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Run tests
npm test
```

---

## 📄 License

MIT © [Your Name]

See [LICENSE](./LICENSE) for more information.

---

## 🔗 Links

- [Documentation](./docs/)
- [Changelog](./CHANGELOG.md)
- [Issues](https://github.com/yourusername/rhino-client/issues)
- [Laravel Backend Package](https://github.com/yourusername/laravel-global-controller)
- [npm Package](https://www.npmjs.com/package/@startsoft/lumina)

---

## 🙏 Acknowledgments

Inspired by the [Rhino Framework](https://rhino-framework.com) for Rails. Built to bring the same powerful patterns to Laravel + React applications.

---

<p align="center">
  Made with ❤️ for the Laravel community
</p>
