export class DiffParser {
  /**
   * Extracts the original code from a diff hunk
   * @param diffHunk The diff hunk from GitHub's API
   * @returns The original code (lines that were removed or unchanged)
   */
  extractOriginalCode(diffHunk: string | undefined): string {
    if (!diffHunk) return '';
    
    const lines = diffHunk.split('\n');
    const originalLines: string[] = [];
    
    for (const line of lines) {
      // Skip the diff header line
      if (line.startsWith('@@')) continue;
      
      // Lines starting with '-' (removed) or ' ' (unchanged) are original code
      if (line.startsWith('-') || (line.startsWith(' ') && line.length > 0)) {
        originalLines.push(line.substring(1));
      }
    }
    
    return originalLines.join('\n');
  }

  /**
   * Extracts the new/suggested code from a diff hunk
   * @param diffHunk The diff hunk from GitHub's API
   * @returns The new code (lines that were added or unchanged)
   */
  extractNewCode(diffHunk: string | undefined): string {
    if (!diffHunk) return '';
    
    const lines = diffHunk.split('\n');
    const newLines: string[] = [];
    
    for (const line of lines) {
      // Skip the diff header line
      if (line.startsWith('@@')) continue;
      
      // Lines starting with '+' (added) or ' ' (unchanged) are new code
      if (line.startsWith('+') || (line.startsWith(' ') && line.length > 0)) {
        newLines.push(line.substring(1));
      }
    }
    
    return newLines.join('\n');
  }

  /**
   * Extracts a suggestion from a comment body
   * @param body The comment body
   * @returns The suggestion content if found, null otherwise
   */
  extractSuggestion(body: string): string | null {
    // Match both ```suggestion and ```diff suggestion patterns
    const suggestionMatch = body.match(/```(?:suggestion|diff suggestion)\s*\n([\s\S]*?)\n```/);
    if (suggestionMatch) {
      return suggestionMatch[1];
    }
    
    // Also check for plain code blocks that might be suggestions
    const codeBlockMatch = body.match(/```\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch && body.toLowerCase().includes('suggest')) {
      return codeBlockMatch[1];
    }
    
    return null;
  }

  /**
   * Gets the full context from a diff hunk, including line numbers
   * @param diffHunk The diff hunk from GitHub's API
   * @returns Object with original and new code with line numbers
   */
  parseFullDiffContext(diffHunk: string | undefined): {
    originalCode: string;
    newCode: string;
    startLine: number;
    lineCount: number;
  } {
    if (!diffHunk) {
      return { originalCode: '', newCode: '', startLine: 0, lineCount: 0 };
    }
    
    const lines = diffHunk.split('\n');
    const header = lines.find(line => line.startsWith('@@'));
    
    let startLine = 0;
    let lineCount = 0;
    
    if (header) {
      // Parse header like "@@ -16,33 +16,40 @@"
      const match = header.match(/@@ -(\d+),(\d+) \+\d+,\d+ @@/);
      if (match) {
        startLine = parseInt(match[1], 10);
        lineCount = parseInt(match[2], 10);
      }
    }
    
    return {
      originalCode: this.extractOriginalCode(diffHunk),
      newCode: this.extractNewCode(diffHunk),
      startLine,
      lineCount
    };
  }
}