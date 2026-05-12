export interface PortfolioPoint {
  volatility: number;
  return: number;
  weights: number[]; // Guaranteed to sum to 1.0
  sharpe: number;
}

export interface EfficientFrontierResult {
  boundaryPoints: PortfolioPoint[];
  minVariance: PortfolioPoint;
  maxSharpe: PortfolioPoint;
}

function generateRandomWeights(n: number): number[] {
  const w = new Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    w[i] = Math.random();
    sum += w[i];
  }
  for (let i = 0; i < n; i++) {
    w[i] /= sum;
  }
  return w;
}

export async function runEfficientFrontierAsync(
  symbols: string[],
  covarianceMatrix: number[][],
  expectedReturns: number[], // Daily expected returns per asset
  resolution: number = 50, // Number of points to plot on the frontier
  onProgress?: (progress: number) => void
): Promise<EfficientFrontierResult> {
  const numAssets = symbols.length;
  if (numAssets < 2) throw new Error("At least 2 assets required for efficient frontier");

  // Annualize inputs
  const annReturns = expectedReturns.map(r => r * 252);
  const annCov = covarianceMatrix.map(row => row.map(v => v * 252));

  // Determine number of simulations based on number of assets
  const numSimulations = Math.min(20000, 2000 * Math.pow(1.5, Math.max(0, numAssets - 2)));
  
  const portfolios: PortfolioPoint[] = [];

  for (let i = 0; i < numSimulations; i++) {
    if (i > 0 && i % 2000 === 0) {
      if (onProgress) onProgress(i / numSimulations);
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield
    }

    const w = generateRandomWeights(numAssets);
    let portRet = 0;
    for (let j = 0; j < numAssets; j++) portRet += w[j] * annReturns[j];
    
    let portVar = 0;
    for (let r = 0; r < numAssets; r++) {
      for (let c = 0; c < numAssets; c++) {
        portVar += w[r] * w[c] * annCov[r][c];
      }
    }
    const portVol = Math.sqrt(portVar);
    
    portfolios.push({
      weights: w,
      return: portRet,
      volatility: portVol,
      sharpe: portVol > 0 ? portRet / portVol : 0
    });
  }

  if (onProgress) onProgress(1);

  // Sort by volatility to easily find min variance and extract boundary
  portfolios.sort((a, b) => a.volatility - b.volatility);
  
  const minVariancePoint = portfolios[0];
  
  let maxSharpePoint = portfolios[0];
  for (const p of portfolios) {
    if (p.sharpe > maxSharpePoint.sharpe) maxSharpePoint = p;
  }

  // Extract upper boundary (Efficient Frontier)
  // We only care about portfolios that offer higher returns for higher volatility
  const trueFrontier: PortfolioPoint[] = [];
  let currentMaxRet = minVariancePoint.return - 0.0001; // start slightly below min var return
  
  for (const p of portfolios) {
    if (p.return > currentMaxRet) {
      trueFrontier.push(p);
      currentMaxRet = p.return;
    }
  }

  // Downsample to 'resolution' points by binning volatility for a smooth chart
  const binnedFrontier: PortfolioPoint[] = [];
  if (trueFrontier.length > resolution) {
    const minVol = trueFrontier[0].volatility;
    const maxVol = trueFrontier[trueFrontier.length - 1].volatility;
    const step = (maxVol - minVol) / resolution;
    
    let currentBucket = minVol + step;
    let bestInBucket: PortfolioPoint | null = null;
    
    for (const p of trueFrontier) {
      if (p.volatility <= currentBucket) {
        if (!bestInBucket || p.return > bestInBucket.return) {
          bestInBucket = p;
        }
      } else {
        if (bestInBucket) binnedFrontier.push(bestInBucket);
        currentBucket += step;
        bestInBucket = p;
      }
    }
    if (bestInBucket) binnedFrontier.push(bestInBucket);
  } else {
    binnedFrontier.push(...trueFrontier);
  }

  // Make sure we include the exact maxSharpe and minVariance if they got binned out
  if (!binnedFrontier.includes(minVariancePoint)) binnedFrontier.unshift(minVariancePoint);
  
  // Clean up slightly out of order points after binning
  binnedFrontier.sort((a, b) => a.volatility - b.volatility);

  return {
    boundaryPoints: binnedFrontier,
    minVariance: minVariancePoint,
    maxSharpe: maxSharpePoint
  };
}
