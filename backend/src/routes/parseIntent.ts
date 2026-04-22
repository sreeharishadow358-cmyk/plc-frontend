import { Router } from 'express';
import { validateApiRequest, errorResponse, successResponse } from '../lib/apiMiddleware.js';

export const parseIntentRouter = Router();

interface AddressMatch {
  value: string;
  index: number;
}

interface ParsedIntent {
  type: 'motor_control' | 'timer_control' | 'counter_control' | 'output_control';
  start: string;
  stop: string;
  emergency: string;
  output: string;
  confidence: number;
  matchedAddresses: string[];
  defaultsApplied: string[];
}

const INPUT_ADDRESS_PATTERN = /\bX[0-7]{1,3}\b/gi;
const OUTPUT_ADDRESS_PATTERN = /\b(?:Y[0-7]{1,3}|M\d+|T\d+|C\d+)\b/gi;
const EMERGENCY_KEYWORDS = ['emergency stop', 'emergency', 'e-stop', 'estop', 'safety'];
const STOP_KEYWORDS = ['stop', 'halt', 'disable', 'off', 'release', 'reset'];
const START_KEYWORDS = ['start', 'run', 'enable', 'on', 'pressed', 'push'];
const OUTPUT_KEYWORDS = ['output', 'motor', 'pump', 'fan', 'lamp', 'coil', 'valve', 'contactor'];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findAddressFromPatterns(
  input: string,
  patterns: RegExp[],
  usedAddresses: Set<string>
): string | null {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    const address = match?.groups?.address;
    if (address) {
      const normalizedAddress = address.toUpperCase();
      if (!usedAddresses.has(normalizedAddress)) {
        return normalizedAddress;
      }
    }
  }

  return null;
}

function getAddressMatches(input: string, pattern: RegExp): AddressMatch[] {
  const matches = Array.from(input.matchAll(pattern));
  const seen = new Set<string>();

  return matches
    .map((match) => ({
      value: match[0].toUpperCase(),
      index: match.index ?? 0,
    }))
    .filter((match) => {
      if (seen.has(match.value)) {
        return false;
      }

      seen.add(match.value);
      return true;
    });
}

function getKeywordPositions(input: string, keywords: string[]): number[] {
  return keywords.flatMap((keyword) => {
    const pattern = new RegExp(escapeRegExp(keyword), 'gi');
    return Array.from(input.matchAll(pattern)).map((match) => match.index ?? 0);
  });
}

function selectClosestAddress(
  addresses: AddressMatch[],
  keywordPositions: number[],
  usedAddresses: Set<string>
): string | null {
  let bestMatch: AddressMatch | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const address of addresses) {
    if (usedAddresses.has(address.value)) {
      continue;
    }

    if (keywordPositions.length === 0) {
      if (!bestMatch) {
        bestMatch = address;
      }
      continue;
    }

    const distance = keywordPositions.reduce((closestDistance, keywordIndex) => {
      return Math.min(closestDistance, Math.abs(address.index - keywordIndex));
    }, Number.POSITIVE_INFINITY);

    if (distance < bestDistance) {
      bestMatch = address;
      bestDistance = distance;
    }
  }

  return bestMatch?.value ?? null;
}

function selectFallbackAddress(
  addresses: AddressMatch[],
  usedAddresses: Set<string>,
  fallback: string
): string {
  const nextAddress = addresses.find((address) => !usedAddresses.has(address.value));
  const selected = nextAddress?.value ?? fallback;
  usedAddresses.add(selected);
  return selected;
}

function inferIntentType(input: string, output: string): ParsedIntent['type'] {
  if (/\b(timer|delay|after)\b/i.test(input) || output.startsWith('T')) {
    return 'timer_control';
  }

  if (/\b(counter|count|pieces|quantity)\b/i.test(input) || output.startsWith('C')) {
    return 'counter_control';
  }

  if (/\b(motor|pump|fan|conveyor|valve)\b/i.test(input)) {
    return 'motor_control';
  }

  return 'output_control';
}

function parseIntent(input: string): ParsedIntent {
  const normalizedInput = input.toUpperCase();
  const inputAddresses = getAddressMatches(normalizedInput, INPUT_ADDRESS_PATTERN);
  const outputAddresses = getAddressMatches(normalizedInput, OUTPUT_ADDRESS_PATTERN);
  const usedAddresses = new Set<string>();
  const defaultsApplied: string[] = [];

  const emergency =
    findAddressFromPatterns(normalizedInput, [
      /(?:EMERGENCY STOP|EMERGENCY|E-STOP|ESTOP|SAFETY)(?:\s+(?:ON|AT|BUTTON|INPUT|SIGNAL))?[^A-Z0-9]{0,10}(?<address>X[0-7]{1,3})/i,
      /(?<address>X[0-7]{1,3})[^.]{0,20}(?:EMERGENCY STOP|EMERGENCY|E-STOP|ESTOP|SAFETY)/i,
    ], usedAddresses) ??
    selectClosestAddress(
      inputAddresses,
      getKeywordPositions(normalizedInput, EMERGENCY_KEYWORDS),
      usedAddresses
    ) ??
    selectFallbackAddress(inputAddresses, usedAddresses, 'X2');
  usedAddresses.add(emergency);
  if (!inputAddresses.some((address) => address.value === emergency)) {
    defaultsApplied.push('emergency');
  }

  const stop =
    findAddressFromPatterns(normalizedInput, [
      /(?:\bSTOP\b(?!\s*WATCH)|HALT|DISABLE|OFF|RELEASE|RESET)(?:\s+(?:ON|AT|BUTTON|INPUT|SIGNAL))?[^A-Z0-9]{0,10}(?<address>X[0-7]{1,3})/i,
      /(?<address>X[0-7]{1,3})[^.]{0,20}(?:\bSTOP\b(?!\s*WATCH)|HALT|DISABLE|OFF|RELEASE|RESET)/i,
    ], usedAddresses) ??
    selectClosestAddress(
      inputAddresses,
      getKeywordPositions(normalizedInput, STOP_KEYWORDS),
      usedAddresses
    ) ??
    selectFallbackAddress(inputAddresses, usedAddresses, 'X1');
  usedAddresses.add(stop);
  if (!inputAddresses.some((address) => address.value === stop)) {
    defaultsApplied.push('stop');
  }

  const start =
    findAddressFromPatterns(normalizedInput, [
      /(?:\bSTART\b|\bRUN\b|\bENABLE\b|PRESSED|PUSH)(?:\s+(?:ON|AT|BUTTON|INPUT|SIGNAL))?[^A-Z0-9]{0,10}(?<address>X[0-7]{1,3})/i,
      /(?<address>X[0-7]{1,3})[^.]{0,20}(?:\bSTART\b|\bRUN\b|\bENABLE\b|PRESSED|PUSH)/i,
      /\bON\b[^A-Z0-9]{0,6}(?<address>X[0-7]{1,3})/i,
    ], usedAddresses) ??
    selectClosestAddress(
      inputAddresses,
      getKeywordPositions(normalizedInput, START_KEYWORDS),
      usedAddresses
    ) ??
    selectFallbackAddress(inputAddresses, usedAddresses, 'X0');
  usedAddresses.add(start);
  if (!inputAddresses.some((address) => address.value === start)) {
    defaultsApplied.push('start');
  }

  const output =
    findAddressFromPatterns(normalizedInput, [
      /(?:OUTPUT(?:\s+(?:TO|COIL))?|MOTOR|PUMP|FAN|LAMP|COIL|VALVE|CONTACTOR)(?:\s+(?:TO|AT|COIL))?[^A-Z0-9]{0,10}(?<address>(?:Y[0-7]{1,3}|M\d+|T\d+|C\d+))/i,
      /(?<address>(?:Y[0-7]{1,3}|M\d+|T\d+|C\d+))[^.]{0,20}(?:OUTPUT|MOTOR|PUMP|FAN|LAMP|COIL|VALVE|CONTACTOR)/i,
    ], usedAddresses) ??
    selectClosestAddress(
      outputAddresses,
      getKeywordPositions(normalizedInput, OUTPUT_KEYWORDS),
      usedAddresses
    ) ??
    outputAddresses.find((address) => !usedAddresses.has(address.value))?.value ??
    'Y0';
  usedAddresses.add(output);
  if (!outputAddresses.some((address) => address.value === output)) {
    defaultsApplied.push('output');
  }

  const matchedAddresses = [...new Set([...inputAddresses, ...outputAddresses].map((address) => address.value))];
  const inferredFields = 4 - defaultsApplied.length;
  const confidence = Number(Math.min(0.95, 0.35 + inferredFields * 0.15).toFixed(2));

  return {
    type: inferIntentType(input, output),
    start,
    stop,
    emergency,
    output,
    confidence,
    matchedAddresses,
    defaultsApplied,
  };
}

parseIntentRouter.post('/', (req, res) => {
  const validation = validateApiRequest(req);
  if (!validation.valid) {
    return errorResponse(res, validation.message ?? 'Invalid request', 400);
  }

  const { input } = req.body as { input?: unknown };
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return errorResponse(res, 'Input is required and must be a non-empty string.', 400);
  }

  return successResponse(res, parseIntent(input));
});
