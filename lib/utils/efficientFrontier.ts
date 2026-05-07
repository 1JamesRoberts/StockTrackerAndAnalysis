export interface PortfolioPoint {
  volatility: number;
  return: number;
  weights: number[];
  sharpe: number;
}

export interface EfficientFrontierResult {
  boundaryPoints: PortfolioPoint[]; // Downsampled curve points
  minVariance: PortfolioPoint;
  maxSharpe: PortfolioPoint;
}

export async function runEfficientFrontierAsync(
  symbols: string[],
  covarianceMatrix: number[][],
  expectedReturns: number[], // Daily expected returns per asset
  simulations: number = 5000,
  onProgress?: (progress: number) => void
): Promise<EfficientFrontierResult> {
  const numAssets = symbols.length;
  if (numAssets < 2) throw new Error("At least 2 assets required for efficient frontier");

  let minVariancePoint: PortfolioPoint | null = null;
  let maxSharpePoint: PortfolioPoint | null = null;
  
  let maxReturn = -Infinity;
  let minReturn = Infinity;

  const BATCH_SIZE = 500;
  const allPoints: PortfolioPoint[] = [];

  for (let i = 0; i < simulations; i++) {
    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) onProgress(i / simulations);
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // 1. Generate random weights
    let weights = new Array(numAssets);
    let sum = 0;
    for (let j = 0; j < numAssets; j++) {
      const w = Math.random();
      weights[j] = w;
      sum += w;
    }
    // Normalize weights to sum to 1
    weights = weights.map(w => w / sum);

    // 2. Calculate Portfolio Return = w^T * R
    let portReturn = 0;
    for (let j = 0; j < numAssets; j++) {
      portReturn += weights[j] * expectedReturns[j];
    }
    // Annualize return (assuming daily inputs)
    const annualReturn = portReturn * 252;

    // 3. Calculate Portfolio Variance = w^T * Cov * w
    let portVar = 0;
    for (let row = 0; row < numAssets; row++) {
      for (let col = 0; col < numAssets; col++) {
        portVar += weights[row] * weights[col] * covarianceMatrix[row][col];
      }
    }
    
    // Annualize volatility
    const annualVol = Math.sqrt(portVar) * Math.sqrt(252);
    
    // Sharpe Ratio (assuming risk free = 0)
    const sharpe = annualVol > 0 ? annualReturn / annualVol : 0;

    const point: PortfolioPoint = {
      volatility: annualVol,
      return: annualReturn,
      weights,
      sharpe
    };

    allPoints.push(point);

    if (annualReturn > maxReturn) maxReturn = annualReturn;
    if (annualReturn < minReturn) minReturn = annualReturn;

    if (!minVariancePoint || annualVol < minVariancePoint.volatility) {
      minVariancePoint = point;
    }
    
    if (!maxSharpePoint || sharpe > maxSharpePoint.sharpe) {
      maxSharpePoint = point;
    }
  }

  if (onProgress) onProgress(1);

  // 4. Extract Efficient Frontier Boundary (Upper edge of the scatter)
  // We divide the volatility range into bins, and find the max return for each bin
  const boundaryPoints: PortfolioPoint[] = [];
  
  if (minVariancePoint && maxSharpePoint) {
    // Sort all points by volatility
    allPoints.sort((a, b) => a.volatility - b.volatility);
    
    // We only care about the upper frontier, so return >= minVariancePoint.return
    const validPoints = allPoints.filter(p => p.return >= minVariancePoint!.return);
    
    let currentMaxVol = minVariancePoint.volatility;
    let currentMaxRet = minVariancePoint.return;
    
    // Extract a clean curve by keeping points that dominate
    boundaryPoints.push(minVariancePoint);
    
    for (const p of validPoints) {
      if (p.return > currentMaxRet) {
        // Simple downsampling: only add if return increases significantly (e.g. by 0.1%)
        if (p.return - currentMaxRet > 0.001) {
          boundaryPoints.push(p);
          currentMaxRet = p.return;
        }
      }
    }
  }

  return {
    boundaryPoints,
    minVariance: minVariancePoint!,
    maxSharpe: maxSharpePoint!
  };
}
