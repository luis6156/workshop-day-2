# Contributing Guide

Thank you for your interest in contributing to this demo application!

## Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- kubectl (for Kubernetes)
- Terraform (for infrastructure)
- Git

### Getting Started

1. **Fork and Clone**

```bash
git clone https://github.com/yourusername/workshop-day2.git
cd workshop-day2
```

2. **Install Dependencies**

```bash
make install
# or
cd backend && npm install
cd ../frontend && npm install
```

3. **Environment Setup**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run Development Servers**

```bash
# Terminal 1 - Backend
make dev-backend

# Terminal 2 - Frontend
make dev-frontend

# Or use Docker
make up
```

## Project Structure

```
.
├── backend/          # Node.js/TypeScript backend
├── frontend/         # React/TypeScript frontend
├── docker/           # Docker configurations
├── k8s/             # Kubernetes manifests
├── terraform/       # Terraform IaC
├── monitoring/      # LGTM stack configs
└── docs/            # Documentation
```

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test updates

Example: `feature/add-user-authentication`

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(backend): add WebSocket notification support

Implement real-time notifications using Socket.io with Redis pub/sub

Closes #123
```

### Code Style

**Backend (TypeScript)**
```bash
cd backend
npm run lint
npm run format
```

**Frontend (TypeScript)**
```bash
cd frontend
npm run lint
npm run format
```

### Testing

```bash
# Run all tests
make test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/my-feature
```

2. **Make Changes**
- Write clean, documented code
- Add/update tests
- Update documentation

3. **Test Locally**
```bash
make test
make build
make up
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add my feature"
```

5. **Push to Fork**
```bash
git push origin feature/my-feature
```

6. **Create Pull Request**
- Use clear title and description
- Reference any related issues
- Add screenshots for UI changes
- Ensure CI passes

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Builds successfully
- [ ] Reviewed own code
- [ ] Added descriptive commit messages

## Development Guidelines

### Backend Development

**Adding New Endpoints**

```typescript
// src/routes/api.routes.ts
router.get('/new-endpoint', async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error message' });
  }
});
```

**Adding Metrics**

```typescript
// src/utils/metrics.ts
export const newMetric = new client.Counter({
  name: 'new_metric_total',
  help: 'Description',
  labelNames: ['label1', 'label2'],
  registers: [register],
});
```

### Frontend Development

**Adding New Components**

```typescript
// src/components/NewComponent.tsx
import { useState } from 'react';
import './NewComponent.css';

interface NewComponentProps {
  prop1: string;
}

function NewComponent({ prop1 }: NewComponentProps) {
  const [state, setState] = useState('');
  
  return (
    <div className="new-component">
      {/* Implementation */}
    </div>
  );
}

export default NewComponent;
```

### Docker

**Updating Images**

```bash
# Rebuild specific service
docker-compose build backend

# Rebuild all
make build
```

### Kubernetes

**Testing Manifests**

```bash
# Dry run
kubectl apply -f k8s/ --dry-run=client

# Apply to test namespace
kubectl apply -f k8s/ -n test
```

### Terraform

**Testing Changes**

```bash
# Initialize
make tf-init

# Plan
make tf-plan

# Apply to dev workspace
terraform workspace select dev
make tf-apply
```

## Documentation

### Code Documentation

```typescript
/**
 * Function description
 * @param param1 - Parameter description
 * @returns Return value description
 * @throws ErrorType - When error occurs
 */
function myFunction(param1: string): Promise<Result> {
  // Implementation
}
```

### API Documentation

Update API documentation in:
- `backend/README.md`
- OpenAPI/Swagger specs

### Architecture Documentation

Update diagrams and architecture docs in:
- `README.md`
- `docs/ARCHITECTURE.md`

## Common Tasks

### Adding a New Service

1. Create service in `backend/src/services/`
2. Add tests
3. Update Docker configuration
4. Add Kubernetes manifest
5. Update Terraform if needed
6. Document in README

### Adding Observability

1. Add metrics in `src/utils/metrics.ts`
2. Add log statements using `logger`
3. Add traces using OpenTelemetry
4. Update Grafana dashboards

### Updating Dependencies

```bash
# Check outdated
npm outdated

# Update package
npm update package-name

# Test
npm test
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
make clean
make build
```

### Tests Fail

```bash
# Run specific test
npm test -- --testNamePattern="test name"

# Debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Docker Issues

```bash
# Clean Docker
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check project docs
- **Examples**: Look at existing code

## Code of Conduct

- Be respectful and inclusive
- Follow project guidelines
- Provide constructive feedback
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be added to CONTRIBUTORS.md

Thank you for contributing! 🎉
