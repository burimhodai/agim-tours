export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',

  // Authorization
  FORBIDDEN: 'You do not have permission to perform this action',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_DELETED: 'User has been deleted',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
};

export const SUCCESS_MESSAGES = {
  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',

  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
};
