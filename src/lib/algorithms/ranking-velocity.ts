/**
 * Ranking Velocity Algorithm
 * 
 * Formula: Velocity = (Position_today - Position_N_days_ago) / N
 * Note: In SEO, lower position is better. 
 * Negative velocity = Improvement (Moving towards 1).
 * Positive velocity = Decline (Moving away from 1).
 */

export const VELOCITY_THRESHOLDS = {
    RAPID_DECLINE: 0.5,    // Dropped > 0.5 spots per day avg
    MOMENTUM_BUILD: -0.3,  // Improved > 0.3 spots per day avg
    STABLE: 0.1            // Minor fluctuations
};

export type Velocitycategory = 'RAPID_DECLINE' | 'MOMENTUM_BUILD' | 'STABLE' | 'DECLINE' | 'IMPROVEMENT';

export function calculateVelocity(currentPos: number, previousPos: number, days: number): number {
    if (days === 0) return 0;
    // (Current - Previous) / Days
    // Ex: Current 5, Prev 10, Days 5 => (5 - 10) / 5 = -1 (Improved 1 spot per day)
    return Number(((currentPos - previousPos) / days).toFixed(4));
}

export function classifyVelocity(velocity: number): Velocitycategory {
    if (velocity > VELOCITY_THRESHOLDS.RAPID_DECLINE) return 'RAPID_DECLINE';
    if (velocity < VELOCITY_THRESHOLDS.MOMENTUM_BUILD) return 'MOMENTUM_BUILD';
    if (velocity > 0) return 'DECLINE';
    if (velocity < 0) return 'IMPROVEMENT';
    return 'STABLE';
}
