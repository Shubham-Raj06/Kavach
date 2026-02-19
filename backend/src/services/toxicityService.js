/**
 * Toxicity Service — lightweight local content moderation.
 * No external API dependency. Falls back gracefully on any error.
 *
 * Score:  0.0–0.49 → APPROVED
 *         0.5–0.69 → FLAGGED (visible but marked)
 *         0.70+    → REJECTED
 */

const TOXIC_PATTERNS = [
    // Violence/threats
    /kill\s*you/i, /bomb\s*attack/i, /blow\s*up/i,
    // Hate speech
    /\b(chutiya|bhosdike|madarchod|behenchod|randi|harami)\b/i,
    /\b(nigger|faggot|kike|spic)\b/i,
    // Misinformation triggers
    /5g\s*causes?\s*(virus|covid|disease)/i,
    /vaccines?\s*(kill|microchip|poison)/i,
    /fake\s*outbreak/i,
    /government\s*(poisoning|killing)\s*(us|people|citizens)/i,
];

const MILD_PATTERNS = [
    /\b(stupid|idiot|moron|dumb)\b/i,
    /\b(shut\s*up|go\s*to\s*hell)\b/i,
];

/**
 * Score text for toxicity.
 * @returns {{ score: number, flagged: boolean, reason: string }}
 */
exports.score = (text = '') => {
    try {
        const cleaned = text.trim();
        if (!cleaned) return { score: 0, flagged: false, reason: '' };

        let score = 0;
        let reasons = [];

        // Hard toxic patterns → score 0.85 each hit
        for (const pattern of TOXIC_PATTERNS) {
            if (pattern.test(cleaned)) {
                score = Math.min(score + 0.4, 1.0);
                reasons.push(pattern.source.split('(')[0].replace(/\\/g, ''));
            }
        }

        // Mild patterns → score 0.25 each
        for (const pattern of MILD_PATTERNS) {
            if (pattern.test(cleaned)) {
                score = Math.min(score + 0.25, 1.0);
            }
        }

        // ALL CAPS detection (>60% uppercase after removing spaces)
        const letters = cleaned.replace(/[^a-zA-Z]/g, '');
        if (letters.length > 10) {
            const upperRatio = (letters.match(/[A-Z]/g) || []).length / letters.length;
            if (upperRatio > 0.7) score = Math.min(score + 0.15, 1.0);
        }

        return {
            score: Math.round(score * 100) / 100,
            flagged: score >= 0.5,
            reason: reasons.join(', ') || '',
        };
    } catch {
        // Never block a post due to moderation error
        return { score: 0, flagged: false, reason: 'moderation_error' };
    }
};

/**
 * Determine action from score.
 * @returns {'APPROVED'|'FLAGGED'|'REJECTED'}
 */
exports.getAction = (score) => {
    if (score >= 0.70) return 'REJECTED';
    if (score >= 0.50) return 'FLAGGED';
    return 'APPROVED';
};
