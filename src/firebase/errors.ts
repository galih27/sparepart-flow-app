// This is a specialized error class for Firestore permission errors.
// It is intended to be thrown in a development environment only
// to provide rich, contextual information about why a security rule failed.
// This helps in debugging and rapidly iterating on security rules.

// Defines the context for a security rule failure,
// including the path, operation, and the data involved in the request.
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// Custom error class for Firestore permission-denied errors.
export class FirestorePermissionError extends Error {
  // The structured context of the security rule failure.
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    // Construct the error message to be displayed.
    const message = `
FirestoreError: Missing or insufficient permissions.
The following request was denied by Firestore Security Rules:
${JSON.stringify({
  context
}, null, 2)}
`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error log more readable in the browser console.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
