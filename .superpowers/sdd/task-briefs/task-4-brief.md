# Task 4: Increase Temperature and Fix Faithfulness Threshold

## Problem
1. Temperature 0.2 is too low - produces short, dry, deterministic responses unsuitable for a consultant persona
2. Faithfulness threshold 0.3 allows responses that are 70% hallucinated content to pass validation

## Requirements

### 4a. Increase LLM temperature
In `ai-system/config/settings.py` line 65:
- Change `LLM_TEMPERATURE` default from `"0.2"` to `"0.5"`
- This balances factual grounding with natural, varied language

### 4b. Increase faithfulness threshold
In `ai-system/generation/response_validator.py` line 106:
- Change faithfulness threshold from `0.3` to `0.5`
- This ensures at least 50% of meaningful words in the response are supported by context

## Files to Modify
- `ai-system/config/settings.py` (line 65)
- `ai-system/generation/response_validator.py` (line 106)

## Acceptance Criteria
- Default temperature is 0.5
- Faithfulness threshold is 0.5
- No other changes needed - this is a simple config value update
