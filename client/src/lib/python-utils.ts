export function formatPythonError(error: string): string {
  // Clean up Python error messages for better display
  return error
    .replace(/File "<string>",/, '')
    .trim();
}

export function analyzePythonCode(code: string): string[] {
  const suggestions: string[] = [];
  
  // Basic style checks
  if (!code.includes('"""') && !code.includes("'''")) {
    suggestions.push("Add docstrings to document your code");
  }
  
  if (code.includes("print ")) {
    suggestions.push("Use print() function syntax instead of print statement");
  }
  
  return suggestions;
}
