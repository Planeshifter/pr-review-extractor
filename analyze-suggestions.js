const { Octokit } = require('@octokit/rest');

async function analyzeSuggestions() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Get review comments from a PR with suggestions
    const { data: reviewComments } = await octokit.pulls.listReviewComments({
      owner: 'stdlib-js',
      repo: 'stdlib',
      pull_number: 7122,
      per_page: 100
    });

    console.log(`Total comments: ${reviewComments.length}\n`);

    // Analyze suggestion comments
    const suggestionComments = reviewComments.filter(c => 
      c.body.includes('```suggestion')
    );

    console.log(`Found ${suggestionComments.length} suggestion comments\n`);

    suggestionComments.forEach((comment, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`SUGGESTION ${index + 1}`);
      console.log(`${'='.repeat(80)}\n`);
      
      console.log(`File: ${comment.path}`);
      console.log(`Line: ${comment.line || 'N/A'}`);
      console.log(`Start Line: ${comment.start_line || 'N/A'}`);
      console.log(`Original Line: ${comment.original_line || 'N/A'}`);
      console.log(`Original Start Line: ${comment.original_start_line || 'N/A'}`);
      console.log(`Position: ${comment.position || 'N/A'}`);
      console.log(`Original Position: ${comment.original_position || 'N/A'}`);
      console.log(`Side: ${comment.side || 'N/A'}`);
      console.log(`Commit: ${comment.commit_id}`);
      console.log(`Original Commit: ${comment.original_commit_id || 'N/A'}`);
      
      console.log(`\nDiff Hunk:`);
      if (comment.diff_hunk) {
        console.log('```diff');
        console.log(comment.diff_hunk);
        console.log('```');
        
        // Extract the original code from the diff hunk
        const originalCode = extractOriginalCode(comment.diff_hunk);
        if (originalCode) {
          console.log(`\nExtracted Original Code:`);
          console.log('```');
          console.log(originalCode);
          console.log('```');
        }
      } else {
        console.log('  (No diff hunk available)');
      }
      
      console.log(`\nComment Body:`);
      console.log('```');
      console.log(comment.body);
      console.log('```');
      
      // Extract suggestion
      const suggestion = extractSuggestion(comment.body);
      if (suggestion) {
        console.log(`\nExtracted Suggestion:`);
        console.log('```');
        console.log(suggestion);
        console.log('```');
      }
    });

    // Also check non-suggestion comments with line info
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('NON-SUGGESTION COMMENTS WITH LINE INFO');
    console.log(`${'='.repeat(80)}\n`);

    const lineComments = reviewComments.filter(c => 
      !c.body.includes('```suggestion') && (c.line || c.start_line)
    );

    lineComments.forEach((comment, index) => {
      console.log(`\nComment ${index + 1}:`);
      console.log(`  File: ${comment.path}`);
      console.log(`  Line: ${comment.line || 'N/A'}`);
      console.log(`  Start Line: ${comment.start_line || 'N/A'}`);
      console.log(`  Has diff_hunk: ${!!comment.diff_hunk}`);
      if (comment.diff_hunk) {
        console.log(`  Diff preview: ${comment.diff_hunk.split('\\n')[0]}`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

function extractOriginalCode(diffHunk) {
  if (!diffHunk) return null;
  
  const lines = diffHunk.split('\\n');
  const originalLines = [];
  
  for (const line of lines) {
    // Skip the @@ header line
    if (line.startsWith('@@')) continue;
    
    // Lines starting with '-' are removed lines (original code)
    // Lines starting with ' ' (space) are context lines (also original)
    if (line.startsWith('-') || line.startsWith(' ')) {
      // Remove the first character (- or space)
      originalLines.push(line.substring(1));
    }
  }
  
  return originalLines.join('\\n');
}

function extractSuggestion(body) {
  const suggestionMatch = body.match(/```suggestion\\n([\\s\\S]*?)\\n```/);
  return suggestionMatch ? suggestionMatch[1] : null;
}

analyzeSuggestions();