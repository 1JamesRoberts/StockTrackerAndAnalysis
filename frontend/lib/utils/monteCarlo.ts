// Box-Muller transform for standard normal distribution
function randomNormal(): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export interface MonteCarloResult {
  percentile5: number[];
  percentile50: number[];
  percentile95: number[];
  samplePaths: number[][];
}

export async function runMonteCarloAsync(
  currentPrice: number,
  dailyVol: number,
  dailyDrift: number,
  days: number,
  simulations: number = 5000,
  onProgress?: (progress: number) => void
): Promise<MonteCarloResult> {
  const allPaths: Float32Array[] = [];
  const samplePaths: number[][] = [];
  const sampleIndices = new Set<number>();
  
  // Pick 5 random indices for background paths
  while (sampleIndices.size < 5 && sampleIndices.size < simulations) {
    sampleIndices.add(Math.floor(Math.random() * simulations));
  }

  const driftTerm = dailyDrift - 0.5 * (dailyVol * dailyVol);
  const BATCH_SIZE = 500; // Yield every 500 simulations to keep UI responsive

  for (let i = 0; i < simulations; i++) {
    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) onProgress(i / simulations);
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
    }

    const path = new Float32Array(days + 1);
    path[0] = currentPrice;
    
    let price = currentPrice;
    for (let d = 1; d <= days; d++) {
      const z = randomNormal();
      price = price * Math.exp(driftTerm + dailyVol * z);
      path[d] = price;
    }
    
    allPaths.push(path);
    if (sampleIndices.has(i)) {
      samplePaths.push(Array.from(path));
    }
  }

  if (onProgress) onProgress(1);

  // Calculate percentiles
  const p5: number[] = new Array(days + 1);
  const p50: number[] = new Array(days + 1);
  const p95: number[] = new Array(days + 1);
  
  // Initialize day 0
  p5[0] = currentPrice;
  p50[0] = currentPrice;
  p95[0] = currentPrice;

  // We only need to sort the cross-section of prices for each day
  for (let d = 1; d <= days; d++) {
    // Collect prices for day d across all paths
    const dayPrices = new Float32Array(simulations);
    for (let i = 0; i < simulations; i++) {
      dayPrices[i] = allPaths[i][d];
    }
    
    dayPrices.sort();
    
    p5[d] = dayPrices[Math.floor(simulations * 0.05)];
    p50[d] = dayPrices[Math.floor(simulations * 0.50)];
    p95[d] = dayPrices[Math.floor(simulations * 0.95)];
    
    // Yield every few days during percentile calculation just in case
    if (d % 30 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return {
    percentile5: p5,
    percentile50: p50,
    percentile95: p95,
    samplePaths
  };
}
