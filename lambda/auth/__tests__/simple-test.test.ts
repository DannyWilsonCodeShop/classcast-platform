// Simple test to verify Jest setup
describe('Simple Test', () => {
  test('should work', () => {
    expect(1 + 1).toBe(2);
  });

  test('should mock AWS SDK', () => {
    // Mock AWS SDK
    jest.mock('aws-sdk', () => ({
      CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
        forgotPassword: jest.fn().mockReturnValue({
          promise: jest.fn()
        })
      }))
    }));

    const { CognitoIdentityServiceProvider } = require('aws-sdk');
    const mockInstance = CognitoIdentityServiceProvider();
    
    expect(mockInstance.forgotPassword).toBeDefined();
    expect(typeof mockInstance.forgotPassword).toBe('function');
  });
});

