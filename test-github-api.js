const { Octokit } = require('@octokit/rest');

async function exploreReviewComments() {
  // You'll need to set your GitHub token here or via environment variable
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Get a specific PR with review comments
    const { data: reviewComments } = await octokit.pulls.listReviewComments({
      owner: 'stdlib-js',
      repo: 'stdlib',
      pull_number: 7122, // PR with suggestion comments
      per_page: 5
    });

    console.log('=== Full Review Comment Structure ===\n');
    
    // Show the full structure of the first comment
    if (reviewComments.length > 0) {
      console.log('First comment full structure:');
      console.log(JSON.stringify(reviewComments[0], null, 2));
      
      console.log('\n=== Key Fields Summary ===\n');
      
      reviewComments.forEach((comment, index) => {
        console.log(`Comment ${index + 1}:`);
        console.log(`  ID: ${comment.id}`);
        console.log(`  Path: ${comment.path || 'N/A'}`);
        console.log(`  Line: ${comment.line || 'N/A'}`);
        console.log(`  Start Line: ${comment.start_line || 'N/A'}`);
        console.log(`  Original Line: ${comment.original_line || 'N/A'}`);
        console.log(`  Original Start Line: ${comment.original_start_line || 'N/A'}`);
        console.log(`  Position: ${comment.position || 'N/A'}`);
        console.log(`  Original Position: ${comment.original_position || 'N/A'}`);
        console.log(`  Side: ${comment.side || 'N/A'}`);
        console.log(`  Start Side: ${comment.start_side || 'N/A'}`);
        console.log(`  Diff Hunk: ${comment.diff_hunk ? 'Present' : 'Missing'}`);
        console.log(`  Body Preview: ${comment.body.substring(0, 100)}...`);
        console.log('---');
      });

      // Check for suggestion comments
      console.log('\n=== Suggestion Comments ===\n');
      const suggestionComments = reviewComments.filter(c => 
        c.body.includes('```suggestion')
      );
      
      if (suggestionComments.length > 0) {
        console.log(`Found ${suggestionComments.length} suggestion comments`);
        
        suggestionComments.forEach((comment, index) => {
          console.log(`\nSuggestion ${index + 1}:`);
          console.log(`  Path: ${comment.path}`);
          console.log(`  Diff Hunk:`);
          if (comment.diff_hunk) {
            console.log(comment.diff_hunk.split('\n').map(l => '    ' + l).join('\n'));
          }
          console.log(`  Body:`);
          console.log(comment.body.split('\n').map(l => '    ' + l).join('\n'));
        });
      }

    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

exploreReviewComments();