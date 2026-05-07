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

// Projects a vector onto the probability simplex sum(x)=1, x>=0
function projectSimplex(v: number[]): number[] {
  const n = v.length;
  const u = [...v].sort((a, b) => b - a);
  let cssv = 0;
  let rho = 0;
  for (let i = 0; i < n; i++) {
    cssv += u[i];
    const t = (cssv - 1) / (i + 1);
    if (u[i] - t > 0) {
      rho = -t;
    } else {
      break;
    }
  }
  return v.map(x => Math.max(x + rho, 0));
}

// Numerical Solver (Projected Adam Gradient Descent) for Markowitz Optimization
function optimizePortfolioAdam(targetReturn: number, annReturns: number[], annCov: number[][], iterations = 1000): number[] {
  const n = annReturns.length;
  let w = new Array(n).fill(1 / n); 
  
  const m = new Array(n).fill(0);
  const v = new Array(n).fill(0);
  const beta1 = 0.9;
  const beta2 = 0.999;
  const epsilon = 1e-8;
  const lr = 0.01;
  const PENALTY = 200; // Penalty multiplier for missing the target return
  
  for (let iter = 1; iter <= iterations; iter++) {
    const currentRet = w.reduce((sum, wi, i) => sum + wi * annReturns[i], 0);
    const grad = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      let covTerm = 0;
      for (let j = 0; j < n; j++) covTerm += annCov[i][j] * w[j];
      const penaltyTerm = PENALTY * (currentRet - targetReturn) * annReturns[i];
      
      // Gradient of L = w^T * Cov * w + PENALTY * (w^T * R - R_target)^2
      grad[i] = 2 * covTerm + 2 * penaltyTerm;
    }
    
    // Adam update
    const wNext = new Array(n);
    for (let i = 0; i < n; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * grad[i];
      v[i] = beta2 * v[i] + (1 - beta2) * grad[i] * grad[i];
      const mHat = m[i] / (1 - Math.pow(beta1, iter));
      const vHat = v[i] / (1 - Math.pow(beta2, iter));
      wNext[i] = w[i] - lr * mHat / (Math.sqrt(vHat) + epsilon);
    }
    
    w = projectSimplex(wNext);
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

  // Determine realistic bounds for the target returns
  const minPossibleReturn = Math.min(...annReturns);
  const maxPossibleReturn = Math.max(...annReturns);

  const boundaryPoints: PortfolioPoint[] = [];

  // Generate frontier points
  for (let i = 0; i <= resolution; i++) {
    if (i > 0 && i % 5 === 0) {
      if (onProgress) onProgress(i / resolution);
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield
    }

    const targetReturn = minPossibleReturn + (maxPossibleReturn - minPossibleReturn) * (i / resolution);
    const weights = optimizePortfolioAdam(targetReturn, annReturns, annCov);

    // Calculate exact realized stats for this weight vector
    let portReturn = 0;
    for (let j = 0; j < numAssets; j++) portReturn += weights[j] * annReturns[j];

    let portVar = 0;
    for (let row = 0; row < numAssets; row++) {
      for (let col = 0; col < numAssets; col++) {
        portVar += weights[row] * weights[col] * annCov[row][col];
      }
    }
    const portVol = Math.sqrt(portVar);
    const sharpe = portVol > 0 ? portReturn / portVol : 0;

    boundaryPoints.push({
      volatility: portVol,
      return: portReturn,
      weights,
      sharpe
    });
  }

  if (onProgress) onProgress(1);

  // Filter out any points that curl backwards (inefficient bottom half of bullet if penalty caused tracking issues)
  boundaryPoints.sort((a, b) => a.volatility - b.volatility);
  
  let minVariancePoint = boundaryPoints[0];
  let maxSharpePoint = boundaryPoints[0];

  for (const p of boundaryPoints) {
    if (p.volatility < minVariancePoint.volatility) minVariancePoint = p;
    if (p.sharpe > maxSharpePoint.sharpe) maxSharpePoint = p;
  }

  // Strictly keep only the upper arc (the true efficient frontier)
  const trueFrontier = boundaryPoints.filter(p => p.return >= minVariancePoint.return - 0.001);

  // We re-sort by return just to have a clean linear sequence from minVariance to maxReturn
  trueFrontier.sort((a, b) => a.return - b.return);

  // Final deduplication for completely overlapping nodes
  const cleanFrontier: PortfolioPoint[] = [];
  for (const p of trueFrontier) {
    if (cleanFrontier.length === 0) {
      cleanFrontier.push(p);
    } else {
      const last = cleanFrontier[cleanFrontier.length - 1];
      if (p.return > last.return + 0.0001 || p.volatility > last.volatility + 0.0001) {
        cleanFrontier.push(p);
      }
    }
  }

  return {
    boundaryPoints: cleanFrontier,
    minVariance: minVariancePoint,
    maxSharpe: maxSharpePoint
  };
}
