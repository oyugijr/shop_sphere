# Contributing to ShopSphere

Thank you for your interest in contributing to ShopSphere! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider implementation details if possible

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/oyugijr/shop_sphere.git
   cd shop_sphere
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
   - Keep commits atomic and well-described

4. **Test your changes**
   ```bash
   # Run tests for affected services
   cd user-service && npm test
   cd ../product-service && npm test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

## Development Guidelines

### Code Style

- Use ES6+ features
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Project Structure

Each microservice follows this structure:
```
service-name/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── middlewares/  # Custom middleware
│   └── utils/        # Utility functions
├── tests/            # Test files
├── app.js           # Application entry point
├── Dockerfile       # Container configuration
└── package.json     # Dependencies and scripts
```

### Adding a New Service

1. Create service directory following the structure above
2. Add Dockerfile
3. Update docker-compose.yml
4. Add health check endpoint
5. Document APIs in docs/API.md
6. Add tests
7. Update README.md

### Testing

- Write unit tests for business logic
- Write integration tests for APIs
- Maintain test coverage above 70%
- Use meaningful test descriptions

Example test structure:
```javascript
describe('User Service', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Test implementation
    });
    
    it('should return error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```

### Error Handling

- Use try-catch blocks for async operations
- Return meaningful error messages
- Use appropriate HTTP status codes
- Log errors with context

Example:
```javascript
try {
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: 'User not found' 
    });
  }
  res.json({ success: true, data: user });
} catch (error) {
  console.error('Error fetching user:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
}
```

### API Design

- Use RESTful conventions
- Use plural nouns for resources
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return consistent response formats
- Include pagination for list endpoints
- Document all endpoints

### Database

- Use meaningful collection and field names
- Add indexes for frequently queried fields
- Validate data before saving
- Use transactions for multi-document operations
- Handle database errors gracefully

### Security

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate and sanitize all inputs
- Implement proper authentication/authorization
- Use HTTPS in production
- Keep dependencies updated

## Review Process

1. All PRs require at least one approval
2. CI/CD checks must pass
3. Code should follow project guidelines
4. Documentation should be updated
5. Tests should pass and maintain coverage

## Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join our community chat (if available)
- Contact maintainers for guidance

## License

By contributing to ShopSphere, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if available)

Thank you for contributing to ShopSphere! 🎉
