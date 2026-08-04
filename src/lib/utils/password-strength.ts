import { HubPasswordStrengthScore } from '../interfaces/input.interface';

/**
 * Default password-strength heuristic: one point each for length ≥ 8, mixed case, a digit and a
 * symbol. Deliberately simple and dependency-free; override per app via
 * `provideHubForms({ password: { strengthFn } })` for zxcvbn-grade scoring.
 *
 * The symbol rule (`[^A-Za-z0-9]`) is ASCII-only, so accented and non-Latin letters (e.g. `é`,
 * `ñ`) count as symbols too — a minor over-count, not a correctness issue for this heuristic.
 */
export function scorePasswordStrength(value: string): HubPasswordStrengthScore {
	if (!value) {
		return 0;
	}

	let score = 0;

	if (value.length >= 8) {
		score++;
	}

	if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
		score++;
	}

	if (/\d/.test(value)) {
		score++;
	}

	if (/[^A-Za-z0-9]/.test(value)) {
		score++;
	}

	return score as HubPasswordStrengthScore;
}
