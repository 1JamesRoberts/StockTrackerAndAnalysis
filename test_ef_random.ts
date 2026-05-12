import { runEfficientFrontierAsync } from './lib/utils/efficientFrontier.ts';

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

function runRandomEF(annReturns: number[], annCov: number[][], numPortfolios = 10000) {
  const n = annReturns.length;
  const portfolios = [];
  
  for (let i = 0; i < numPortfolios; i++) {
    const w = generateRandomWeights(n);
    let portRet = 0;
    for (let j = 0; j < n; j++) portRet += w[j] * annReturns[j];
    
    let portVar = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
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
  
  // Find min variance portfolio
  portfolios.sort((a, b) => a.volatility - b.volatility);
  const minVar = portfolios[0];
  
  // Find max sharpe
  let maxSharpe = portfolios[0];
  for (const p of portfolios) {
    if (p.sharpe > maxSharpe.sharpe) maxSharpe = p;
  }
  
  // Extract upper boundary
  const boundary = [];
  let currentMaxRet = minVar.return - 0.0001; // start from min variance return
  
  for (const p of portfolios) {
    if (p.return > currentMaxRet) {
      boundary.push(p);
      currentMaxRet = p.return;
    }
  }
  
  return { boundary, minVar, maxSharpe };
}

const symbols = ['AAPL', 'MSFT', 'GOOG'];
const cov = [[0.0004, 0.0002, 0.0001], [0.0002, 0.0005, 0.0002], [0.0001, 0.0002, 0.0004]]; 
const returns = [0.001, 0.0015, 0.0012];

const annReturns = returns.map(r => r * 252);
const annCov = cov.map(row => row.map(v => v * 252));

const start = Date.now();
const res = runRandomEF(annReturns, annCov);
console.log(`Time taken: ${Date.now() - start}ms`);
console.log(`Found ${res.boundary.length} boundary points`);
console.log(res.boundary.slice(0, 5));
