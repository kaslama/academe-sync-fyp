const STOP_WORDS = new Set([
  'system', 'using', 'based', 'app', 'portal', 'management', 
  'platform', 'framework', 'study', 'analysis', 'approach',
  'and', 'the', 'for', 'with', 'via', 'from', 'into', 'that',
  'this', 'these', 'those', 'are', 'was', 'were', 'will'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function computeTF(tokens) {
  const tfMap = {};
  tokens.forEach(token => {
    tfMap[token] = (tfMap[token] || 0) + 1;
  });
  return tfMap;
}

function calculateSimilarity(queryText, corpus = []) {
  const queryTokens = tokenize(queryText);
  const queryTF = computeTF(queryTokens);

  let maxScore = 0;
  let matchingTitle = '';

  for (const doc of corpus) {
    const docTokens = tokenize(`${doc.title} ${doc.abstract}`);
    const docTF = computeTF(docTokens);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const term in queryTF) {
      if (docTF[term]) {
        dotProduct += queryTF[term] * docTF[term];
      }
      normA += queryTF[term] ** 2;
    }

    for (const term in docTF) {
      normB += docTF[term] ** 2;
    }

    const similarity = (normA && normB)
      ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
      : 0;

    if (similarity > maxScore) {
      maxScore = similarity;
      matchingTitle = doc.title;
    }
  }

  const scorePercentage = Math.min(100, Math.round(maxScore * 100));
  return {
    score: scorePercentage,
    similarityIndex: scorePercentage,
    flagged: scorePercentage >= 60,
    matchingTitle
  };
}

module.exports = { calculateSimilarity };