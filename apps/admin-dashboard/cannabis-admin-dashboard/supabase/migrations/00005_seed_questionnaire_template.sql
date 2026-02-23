-- Cannabis Admin Dashboard - Default Questionnaire Template
-- Migration: 00005_seed_questionnaire_template
-- Description: Seeds the default patient intake questionnaire (from Budtender MVP)
-- Source: budtender-mvp/src/utils/questionnaireConfig.js

-- Default Global Questionnaire Template (Maine Medical Cannabis Focus)
INSERT INTO questionnaire_templates (
    id,
    dispensary_id, -- NULL = global template
    name,
    description,
    version,
    questions,
    is_active,
    is_default,
    estimated_minutes
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'Maine Medical Cannabis Intake',
    'Medical-focused questionnaire with conditional follow-ups for pain, sleep, and anxiety. Supports both budtender-assisted and self-service modes.',
    1,
    '[
        {
            "id": "what_brings_you_in",
            "key": "what_brings_you_in",
            "title": "What brings you in today?",
            "subtitle": "Help us understand your situation",
            "type": "textarea",
            "order": 1,
            "placeholder": "Tell us a bit about what you are looking for or what you are experiencing...",
            "helperText": "This helps us personalize your recommendations",
            "optional": true,
            "maxLength": 500,
            "icon": "SparklesIcon",
            "maps_to": "medical_goal"
        },
        {
            "id": "primary_need",
            "key": "primary_need",
            "title": "What is your primary need?",
            "subtitle": "Select the main reason you are seeking medical cannabis",
            "type": "single_choice",
            "order": 2,
            "required": true,
            "icon": "HeartIcon",
            "maps_to": "desired_effects",
            "options": [
                {"value": "pain", "label": "Pain Relief", "description": "Chronic pain, injury pain, or general discomfort", "followUp": "pain_type"},
                {"value": "sleep", "label": "Sleep Issues", "description": "Insomnia, restless sleep, or difficulty staying asleep", "followUp": "sleep_issues"},
                {"value": "anxiety", "label": "Anxiety & Stress", "description": "General anxiety, stress relief, or nervousness", "followUp": "anxiety_type"},
                {"value": "neuropathic_pain", "label": "Neuropathic Pain", "description": "Nerve pain, tingling, or numbness"},
                {"value": "inflammation", "label": "Inflammation", "description": "Joint inflammation, arthritis, or swelling"},
                {"value": "appetite", "label": "Appetite Stimulation", "description": "Difficulty eating or maintaining appetite"},
                {"value": "nausea", "label": "Nausea Relief", "description": "Nausea from medication or other causes"},
                {"value": "other", "label": "Other", "description": "Something else or multiple concerns", "followUp": "other_needs"}
            ]
        },
        {
            "id": "pain_type",
            "key": "pain_type",
            "title": "What type of pain are you experiencing?",
            "subtitle": "This helps us recommend the right cannabinoid profile",
            "type": "single_choice",
            "order": 3,
            "condition": {"key": "primary_need", "value": "pain"},
            "required": true,
            "maps_to": "medical_conditions",
            "options": [
                {"value": "chronic", "label": "Chronic Pain", "description": "Long-term, persistent pain"},
                {"value": "acute", "label": "Acute Pain", "description": "Recent injury or temporary pain"},
                {"value": "inflammatory", "label": "Inflammatory Pain", "description": "Pain from inflammation or arthritis"},
                {"value": "neuropathic", "label": "Nerve Pain", "description": "Shooting, burning, or tingling pain"}
            ]
        },
        {
            "id": "sleep_issues",
            "key": "sleep_issues",
            "title": "Tell us about your sleep challenges",
            "subtitle": "Understanding your sleep patterns helps us recommend better",
            "type": "multiple_choice",
            "order": 3,
            "condition": {"key": "primary_need", "value": "sleep"},
            "required": true,
            "maps_to": "medical_conditions",
            "options": [
                {"value": "falling_asleep", "label": "Difficulty Falling Asleep", "description": "Taking a long time to fall asleep initially"},
                {"value": "staying_asleep", "label": "Waking Up During Night", "description": "Frequently waking up throughout the night"},
                {"value": "early_waking", "label": "Waking Too Early", "description": "Waking up too early and cannot fall back asleep"},
                {"value": "restless", "label": "Restless Sleep", "description": "Light sleep or not feeling rested"}
            ]
        },
        {
            "id": "anxiety_type",
            "key": "anxiety_type",
            "title": "What type of anxiety do you experience?",
            "subtitle": "Different profiles work better for different types of anxiety",
            "type": "single_choice",
            "order": 3,
            "condition": {"key": "primary_need", "value": "anxiety"},
            "required": true,
            "maps_to": "medical_conditions",
            "options": [
                {"value": "mild", "label": "Mild Anxiety", "description": "Occasional nervousness or stress"},
                {"value": "moderate", "label": "Moderate Anxiety", "description": "Regular anxiety that affects daily life"},
                {"value": "severe", "label": "Severe Anxiety", "description": "Significant anxiety or panic symptoms"},
                {"value": "social", "label": "Social Anxiety", "description": "Anxiety in social situations"}
            ]
        },
        {
            "id": "tried_before",
            "key": "tried_before",
            "title": "Have you tried medical cannabis before?",
            "subtitle": "This helps us gauge your experience level",
            "type": "single_choice",
            "order": 4,
            "required": true,
            "icon": "BeakerIcon",
            "maps_to": "experience_level",
            "options": [
                {"value": "never", "label": "Never", "description": "This is my first time"},
                {"value": "once_or_twice", "label": "Once or Twice", "description": "Very limited experience"},
                {"value": "occasionally", "label": "Occasionally", "description": "A few times, but not regularly"},
                {"value": "regularly", "label": "Regularly", "description": "I use it regularly for my condition"}
            ]
        },
        {
            "id": "experience_level",
            "key": "experience_level",
            "title": "How would you describe your tolerance?",
            "subtitle": "We will adjust THC recommendations accordingly",
            "type": "single_choice",
            "order": 5,
            "required": true,
            "icon": "UserIcon",
            "maps_to": "thc_tolerance",
            "options": [
                {"value": "first_time", "label": "First-Time User", "description": "I am brand new to cannabis"},
                {"value": "low_tolerance", "label": "Low Tolerance", "description": "Small amounts work well for me"},
                {"value": "regular_user", "label": "Regular User", "description": "I use regularly with moderate tolerance"},
                {"value": "high_tolerance", "label": "High Tolerance", "description": "I need higher potency products"}
            ]
        },
        {
            "id": "consumption_method",
            "key": "consumption_method",
            "title": "What is your preferred way to consume?",
            "subtitle": "Different methods have different onset times and durations",
            "type": "single_choice",
            "order": 6,
            "required": true,
            "icon": "FireIcon",
            "maps_to": "consumption_preference",
            "options": [
                {"value": "flower", "label": "Flower (Smoking)", "description": "Traditional method, fast-acting (5-10 min onset)"},
                {"value": "vape", "label": "Vaporizer", "description": "Healthier than smoking, fast-acting (2-5 min onset)"},
                {"value": "edible", "label": "Edibles", "description": "Longer-lasting effects (30-90 min onset, 4-8 hr duration)"},
                {"value": "tincture", "label": "Tinctures", "description": "Sublingual drops, moderate onset (15-45 min)"},
                {"value": "topical", "label": "Topicals", "description": "Creams/balms for localized relief"},
                {"value": "concentrate", "label": "Concentrates", "description": "High potency, fast-acting (experienced users)"}
            ]
        },
        {
            "id": "preferred_time_of_day",
            "key": "preferred_time_of_day",
            "title": "When do you plan to use this?",
            "subtitle": "We will recommend appropriate strain types for your schedule",
            "type": "single_choice",
            "order": 7,
            "required": true,
            "icon": "ClockIcon",
            "maps_to": "usage_context",
            "options": [
                {"value": "morning", "label": "Morning", "description": "Need to stay alert and functional"},
                {"value": "daytime", "label": "Daytime", "description": "Mid-day use while staying productive"},
                {"value": "evening", "label": "Evening", "description": "Winding down after work"},
                {"value": "night", "label": "Night / Bedtime", "description": "Before sleep or nighttime only"},
                {"value": "varies", "label": "It Varies", "description": "Different times depending on the day"}
            ]
        }
    ]'::jsonb,
    true,
    true,
    5
)
ON CONFLICT (id) DO UPDATE SET
    questions = EXCLUDED.questions,
    version = EXCLUDED.version + 1,
    updated_at = NOW();

-- Add a comment
COMMENT ON TABLE questionnaire_templates IS 'Patient intake questionnaire templates - migrated from Budtender MVP questionnaireConfig.js';
