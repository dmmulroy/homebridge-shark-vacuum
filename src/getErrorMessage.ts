function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: unknown, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export function getErrorMessage(error: unknown): string {
  let errorMsg = `${error}`;

  if (error instanceof Error) {
    errorMsg = error.message;
  } else if (!(error instanceof String)) {
    errorMsg = JSON.stringify(error, getCircularReplacer());
  }

  return errorMsg;
}
