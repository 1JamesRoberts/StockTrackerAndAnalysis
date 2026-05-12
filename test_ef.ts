import fs from 'fs';
import { runEfficientFrontierAsync } from './lib/utils/efficientFrontier.ts';

async function test() {
  const symbols = ['AAPL', 'MSFT'];
  const cov = [[0.0004, 0.0002], [0.0002, 0.0005]]; // daily
  const returns = [0.001, 0.0015]; // daily
  
  const result = await runEfficientFrontierAsync(symbols, cov, returns, 10);
  
  console.log("Min Variance:", result.minVariance.return, result.minVariance.volatility, result.minVariance.weights);
  console.log("Max Sharpe:", result.maxSharpe.return, result.maxSharpe.volatility, result.maxSharpe.weights);
  console.log("Boundary Points:");
  result.boundaryPoints.forEach(p => {
    console.log(`Ret: ${p.return.toFixed(4)}, Vol: ${p.volatility.toFixed(4)}, Weights: ${p.weights.map(w => w.toFixed(4)).join(', ')}`);
  });
}

test();
