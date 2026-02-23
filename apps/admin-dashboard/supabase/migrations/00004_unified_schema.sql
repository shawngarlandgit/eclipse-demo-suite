-- Cannabis Admin Dashboard - Unified Schema Migration
-- Migration: 00004_unified_schema
-- Description: Unify Admin Dashboard with Budtender MVP features
-- Adds: Patient role, Strains, Recommendations, Questionnaires

-- ============================================================================
-- PHASE 1: NEW ENUMS
-- ============================================================================

-- Effect types for strain matching and recommendations
CREATE TYPE effect_type AS ENUM (
    'relaxation',
    'pain_relief',
    'anxiety_relief',
    'energy',
    'focus',
    'creativity',
    'appetite',
    'sleep'
);

-- Recommendation session status
CREATE TYPE recommendation_status AS ENUM (
    'pending',
    'viewed',
    'purchased',
    'rejected',
    'expired'
);

-- Questionnaire status
CREATE TYPE questionnaire_status AS ENUM (
    'draft',
    'in_progress',
    'completed',
    'abandoned'
);

-- ============================================================================
-- PHASE 2: EXTEND USER_ROLE ENUM
-- ============================================================================

-- Add 'patient' and 'budtender' roles to existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'patient';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'budtender';

-- ============================================================================
-- PHASE 3: STRAINS TABLE (From Budtender MVP)
-- ============================================================================

CREATE TABLE strains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-safe name
    strain_type VARCHAR(50) CHECK (strain_type IN ('indica', 'sativa', 'hybrid', 'cbd')),

    -- Cannabinoid Profile
    thc_min DECIMAL(5,2),
    thc_max DECIMAL(5,2),
    cbd_min DECIMAL(5,2),
    cbd_max DECIMAL(5,2),
    cbg_percentage DECIMAL(5,2),
    cbn_percentage DECIMAL(5,2),

    -- Terpene Profile
    primary_terpene VARCHAR(100),
    secondary_terpene VARCHAR(100),
    tertiary_terpene VARCHAR(100),
    terpene_profile JSONB DEFAULT '{}', -- Detailed percentages

    -- Effects and Flavors
    primary_effects effect_type[] DEFAULT '{}',
    secondary_effects effect_type[] DEFAULT '{}',
    negative_effects TEXT[] DEFAULT '{}', -- 'dry_mouth', 'paranoia', etc.
    flavors TEXT[] DEFAULT '{}', -- 'citrus', 'pine', 'earthy', etc.

    -- Medical Use Cases
    medical_uses TEXT[] DEFAULT '{}', -- 'chronic_pain', 'insomnia', etc.

    -- Metadata
    description TEXT,
    lineage VARCHAR(255), -- Parent strains
    breeder VARCHAR(255),
    image_url TEXT,

    -- Quality Tracking
    is_verified BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
    recommendation_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_thc_range CHECK (thc_min IS NULL OR thc_max IS NULL OR thc_min <= thc_max),
    CONSTRAINT valid_cbd_range CHECK (cbd_min IS NULL OR cbd_max IS NULL OR cbd_min <= cbd_max)
);

-- Strain Indexes
CREATE INDEX idx_strains_name ON strains(name);
CREATE INDEX idx_strains_slug ON strains(slug);
CREATE INDEX idx_strains_type ON strains(strain_type);
CREATE INDEX idx_strains_effects ON strains USING gin(primary_effects);
CREATE INDEX idx_strains_flavors ON strains USING gin(flavors);
CREATE INDEX idx_strains_medical ON strains USING gin(medical_uses);
CREATE INDEX idx_strains_popularity ON strains(popularity_score DESC);

-- Enable full-text search on strain name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_strains_name_trgm ON strains USING gin(name gin_trgm_ops);

-- ============================================================================
-- PHASE 4: BRANDS TABLE (From Budtender MVP)
-- ============================================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Brand Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,

    -- Business Details
    license_number VARCHAR(100),
    is_local BOOLEAN DEFAULT false, -- Maine-based
    is_organic BOOLEAN DEFAULT false,
    is_craft BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_brand_slug UNIQUE (dispensary_id, slug)
);

-- Brand Indexes
CREATE INDEX idx_brands_dispensary ON brands(dispensary_id);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_active ON brands(is_active);

-- ============================================================================
-- PHASE 5: EXTEND PRODUCTS TABLE
-- ============================================================================

-- Add strain and brand references to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS strain_id UUID REFERENCES strains(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS size_amount DECIMAL(10,3), -- Amount (grams, mg, ml)
ADD COLUMN IF NOT EXISTS size_unit VARCHAR(20), -- 'g', 'mg', 'ml', 'units'
ADD COLUMN IF NOT EXISTS harvest_date DATE,
ADD COLUMN IF NOT EXISTS test_date DATE,
ADD COLUMN IF NOT EXISTS lab_results_url TEXT,
ADD COLUMN IF NOT EXISTS lightspeed_id VARCHAR(100) UNIQUE, -- Lightspeed POS sync
ADD COLUMN IF NOT EXISTS last_lightspeed_sync TIMESTAMPTZ;

-- Product strain/brand indexes
CREATE INDEX IF NOT EXISTS idx_products_strain ON products(strain_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_lightspeed ON products(lightspeed_id);

-- ============================================================================
-- PHASE 6: EXTEND USERS TABLE FOR PATIENTS
-- ============================================================================

-- Add patient-specific fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS patient_number VARCHAR(100) UNIQUE, -- Medical card number
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS medical_card_expiration DATE,
ADD COLUMN IF NOT EXISTS is_medical_patient BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS medical_verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS preferred_effects effect_type[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_categories product_category[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avoid_effects effect_type[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS flavor_preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS price_range_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_range_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS thc_tolerance VARCHAR(20) CHECK (thc_tolerance IN ('low', 'medium', 'high', 'very_high')),
ADD COLUMN IF NOT EXISTS consumption_method TEXT[] DEFAULT '{}', -- 'smoking', 'vaping', 'edibles', etc.
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS patient_notes TEXT,
ADD COLUMN IF NOT EXISTS lightspeed_customer_id VARCHAR(100) UNIQUE, -- Lightspeed POS sync
ADD COLUMN IF NOT EXISTS last_lightspeed_sync TIMESTAMPTZ;

-- Patient-specific indexes
CREATE INDEX IF NOT EXISTS idx_users_patient_number ON users(patient_number) WHERE patient_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_medical_expiration ON users(medical_card_expiration) WHERE is_medical_patient = true;
CREATE INDEX IF NOT EXISTS idx_users_medical_patients ON users(dispensary_id) WHERE is_medical_patient = true;
CREATE INDEX IF NOT EXISTS idx_users_lightspeed ON users(lightspeed_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_effects ON users USING gin(preferred_effects);

-- ============================================================================
-- PHASE 7: RECOMMENDATION SESSIONS (From Budtender MVP)
-- ============================================================================

CREATE TABLE recommendation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be anonymous
    budtender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Session Inputs (what the patient wanted)
    desired_effects effect_type[] DEFAULT '{}',
    desired_category product_category,
    flavor_preferences TEXT[] DEFAULT '{}',
    avoid_effects effect_type[] DEFAULT '{}',
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    experience_level VARCHAR(20) CHECK (experience_level IN ('new', 'occasional', 'regular', 'experienced')),
    consumption_preference TEXT[] DEFAULT '{}',

    -- Medical Context (optional, HIPAA-sensitive)
    medical_goal TEXT, -- 'pain management', 'sleep', etc.
    current_medications TEXT[], -- For interaction awareness

    -- Session Results
    products_recommended UUID[] DEFAULT '{}', -- Array of product IDs
    strains_recommended UUID[] DEFAULT '{}', -- Array of strain IDs
    recommendation_scores JSONB DEFAULT '{}', -- Detailed scoring breakdown
    ai_reasoning TEXT, -- Claude's explanation

    -- Outcome Tracking
    status recommendation_status DEFAULT 'pending',
    converted_to_purchase BOOLEAN DEFAULT false,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

    -- Feedback
    patient_feedback_rating INTEGER CHECK (patient_feedback_rating >= 1 AND patient_feedback_rating <= 5),
    patient_feedback_text TEXT,
    budtender_notes TEXT,

    -- Analytics
    session_duration_seconds INTEGER,
    products_viewed INTEGER DEFAULT 0,

    -- Questionnaire link
    questionnaire_session_id UUID, -- Will reference questionnaire_sessions

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_session CHECK (
        (patient_id IS NOT NULL OR status = 'pending') -- Anonymous sessions allowed during creation
    )
);

-- Recommendation Indexes
CREATE INDEX idx_recommendations_dispensary ON recommendation_sessions(dispensary_id);
CREATE INDEX idx_recommendations_patient ON recommendation_sessions(patient_id);
CREATE INDEX idx_recommendations_budtender ON recommendation_sessions(budtender_id);
CREATE INDEX idx_recommendations_date ON recommendation_sessions(created_at DESC);
CREATE INDEX idx_recommendations_status ON recommendation_sessions(status);
CREATE INDEX idx_recommendations_converted ON recommendation_sessions(dispensary_id) WHERE converted_to_purchase = true;
CREATE INDEX idx_recommendations_effects ON recommendation_sessions USING gin(desired_effects);

-- ============================================================================
-- PHASE 8: QUESTIONNAIRE TEMPLATES
-- ============================================================================

CREATE TABLE questionnaire_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE, -- NULL = global template

    -- Template Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,

    -- Questions (JSONB array)
    questions JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "id": "q1",
    --     "type": "single_choice",
    --     "question": "What effects are you looking for?",
    --     "options": ["Relaxation", "Energy", "Pain Relief", "Sleep"],
    --     "required": true,
    --     "maps_to": "desired_effects"
    --   },
    --   {
    --     "id": "q2",
    --     "type": "multi_choice",
    --     "question": "What flavors do you enjoy?",
    --     "options": ["Citrus", "Earthy", "Sweet", "Pine"],
    --     "required": false,
    --     "maps_to": "flavor_preferences"
    --   }
    -- ]

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    estimated_minutes INTEGER DEFAULT 5,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Template Indexes
CREATE INDEX idx_questionnaire_templates_dispensary ON questionnaire_templates(dispensary_id);
CREATE INDEX idx_questionnaire_templates_active ON questionnaire_templates(is_active);
CREATE INDEX idx_questionnaire_templates_default ON questionnaire_templates(dispensary_id) WHERE is_default = true;

-- ============================================================================
-- PHASE 9: QUESTIONNAIRE SESSIONS (Patient Responses)
-- ============================================================================

CREATE TABLE questionnaire_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES questionnaire_templates(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be anonymous initially

    -- Session Info
    status questionnaire_status DEFAULT 'in_progress',

    -- Responses (JSONB object keyed by question ID)
    responses JSONB DEFAULT '{}',
    -- Example:
    -- {
    --   "q1": "Relaxation",
    --   "q2": ["Citrus", "Sweet"],
    --   "q3": 3
    -- }

    -- Computed Preferences (extracted from responses)
    computed_effects effect_type[] DEFAULT '{}',
    computed_categories product_category[] DEFAULT '{}',
    computed_flavors TEXT[] DEFAULT '{}',
    computed_avoid_effects effect_type[] DEFAULT '{}',
    computed_experience_level VARCHAR(20),

    -- Session Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Link to recommendation
    recommendation_session_id UUID REFERENCES recommendation_sessions(id) ON DELETE SET NULL,

    -- Device/Context
    device_type VARCHAR(50), -- 'tablet', 'phone', 'desktop', 'kiosk'
    ip_address INET,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add back-reference to recommendation_sessions
ALTER TABLE recommendation_sessions
ADD CONSTRAINT fk_recommendation_questionnaire
FOREIGN KEY (questionnaire_session_id) REFERENCES questionnaire_sessions(id) ON DELETE SET NULL;

-- Questionnaire Session Indexes
CREATE INDEX idx_questionnaire_sessions_dispensary ON questionnaire_sessions(dispensary_id);
CREATE INDEX idx_questionnaire_sessions_template ON questionnaire_sessions(template_id);
CREATE INDEX idx_questionnaire_sessions_patient ON questionnaire_sessions(patient_id);
CREATE INDEX idx_questionnaire_sessions_status ON questionnaire_sessions(status);
CREATE INDEX idx_questionnaire_sessions_date ON questionnaire_sessions(created_at DESC);

-- ============================================================================
-- PHASE 10: PRODUCT EFFECTS TRACKING (AI Learning)
-- ============================================================================

CREATE TABLE product_effects_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    effect effect_type NOT NULL,

    -- Success Metrics
    recommended_count INTEGER DEFAULT 0,
    purchased_count INTEGER DEFAULT 0,
    positive_feedback_count INTEGER DEFAULT 0,
    negative_feedback_count INTEGER DEFAULT 0,

    -- Computed score
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN recommended_count > 0
            THEN (purchased_count::DECIMAL / recommended_count * 100)
            ELSE 0
        END
    ) STORED,

    effectiveness_score DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN (positive_feedback_count + negative_feedback_count) > 0
            THEN (positive_feedback_count::DECIMAL / (positive_feedback_count + negative_feedback_count) * 100)
            ELSE 50 -- Neutral default
        END
    ) STORED,

    -- Timestamps
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_product_effect UNIQUE (dispensary_id, product_id, effect)
);

-- Product Effects Indexes
CREATE INDEX idx_product_effects_dispensary ON product_effects_tracking(dispensary_id);
CREATE INDEX idx_product_effects_product ON product_effects_tracking(product_id);
CREATE INDEX idx_product_effects_effect ON product_effects_tracking(effect);
CREATE INDEX idx_product_effects_success ON product_effects_tracking(success_rate DESC);

-- ============================================================================
-- PHASE 11: LIGHTSPEED INTEGRATION TABLES
-- ============================================================================

CREATE TABLE lightspeed_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Sync Details
    sync_type VARCHAR(50) NOT NULL, -- 'products', 'inventory', 'customers', 'sales'
    sync_direction VARCHAR(20) NOT NULL, -- 'pull', 'push', 'bidirectional'

    -- Results
    status VARCHAR(20) NOT NULL, -- 'started', 'success', 'partial', 'failed'
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Error Handling
    errors JSONB DEFAULT '[]',

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Metadata
    triggered_by VARCHAR(50), -- 'scheduled', 'manual', 'webhook'
    api_calls_made INTEGER DEFAULT 0
);

-- Sync Log Indexes
CREATE INDEX idx_lightspeed_sync_dispensary ON lightspeed_sync_logs(dispensary_id);
CREATE INDEX idx_lightspeed_sync_type ON lightspeed_sync_logs(sync_type);
CREATE INDEX idx_lightspeed_sync_status ON lightspeed_sync_logs(status);
CREATE INDEX idx_lightspeed_sync_date ON lightspeed_sync_logs(started_at DESC);

-- ============================================================================
-- PHASE 12: TRIGGERS
-- ============================================================================

-- Update strain popularity on recommendation
CREATE OR REPLACE FUNCTION update_strain_recommendation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.strains_recommended IS NOT NULL AND array_length(NEW.strains_recommended, 1) > 0 THEN
        UPDATE strains
        SET recommendation_count = recommendation_count + 1
        WHERE id = ANY(NEW.strains_recommended);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_strain_recommendations
    AFTER INSERT ON recommendation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_strain_recommendation_count();

-- Update strain purchase count when recommendation converts
CREATE OR REPLACE FUNCTION update_strain_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.converted_to_purchase = true AND OLD.converted_to_purchase = false THEN
        IF NEW.strains_recommended IS NOT NULL AND array_length(NEW.strains_recommended, 1) > 0 THEN
            UPDATE strains
            SET purchase_count = purchase_count + 1
            WHERE id = ANY(NEW.strains_recommended);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_strain_purchases
    AFTER UPDATE ON recommendation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_strain_purchase_count();

-- Track product effects on recommendation conversion
CREATE OR REPLACE FUNCTION track_product_effect_success()
RETURNS TRIGGER AS $$
DECLARE
    product_id UUID;
    effect effect_type;
BEGIN
    IF NEW.converted_to_purchase = true AND OLD.converted_to_purchase = false THEN
        -- For each recommended product and desired effect, update tracking
        FOREACH product_id IN ARRAY COALESCE(NEW.products_recommended, '{}')
        LOOP
            FOREACH effect IN ARRAY COALESCE(NEW.desired_effects, '{}')
            LOOP
                INSERT INTO product_effects_tracking (dispensary_id, product_id, effect, recommended_count, purchased_count)
                VALUES (NEW.dispensary_id, product_id, effect, 1, 1)
                ON CONFLICT (dispensary_id, product_id, effect)
                DO UPDATE SET
                    purchased_count = product_effects_tracking.purchased_count + 1,
                    last_updated = NOW();
            END LOOP;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_product_effects
    AFTER UPDATE ON recommendation_sessions
    FOR EACH ROW EXECUTE FUNCTION track_product_effect_success();

-- Auto-complete questionnaire status
CREATE OR REPLACE FUNCTION auto_complete_questionnaire()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NOW() - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_complete_questionnaire
    BEFORE UPDATE ON questionnaire_sessions
    FOR EACH ROW EXECUTE FUNCTION auto_complete_questionnaire();

-- Update timestamps
CREATE TRIGGER update_strains_updated_at BEFORE UPDATE ON strains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_templates_updated_at BEFORE UPDATE ON questionnaire_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_sessions_updated_at BEFORE UPDATE ON questionnaire_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 13: RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_effects_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lightspeed_sync_logs ENABLE ROW LEVEL SECURITY;

-- Strains: Everyone can read (global library), managers can write
CREATE POLICY "Anyone can view strains"
    ON strains FOR SELECT
    USING (true);

CREATE POLICY "Managers can manage strains"
    ON strains FOR ALL
    USING (auth.is_manager_or_above());

-- Brands: Dispensary-scoped
CREATE POLICY "Users can view dispensary brands"
    ON brands FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

CREATE POLICY "Managers can manage brands"
    ON brands FOR ALL
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- Recommendation Sessions: Budtenders and above can view/create
CREATE POLICY "Staff can view recommendations"
    ON recommendation_sessions FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        patient_id = auth.uid() OR -- Patients can see their own
        auth.is_admin()
    );

CREATE POLICY "Staff can create recommendations"
    ON recommendation_sessions FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        (
            auth.user_role() IN ('budtender', 'staff', 'manager', 'owner', 'admin') OR
            patient_id = auth.uid() -- Patient self-service
        )
    );

CREATE POLICY "Staff can update own recommendations"
    ON recommendation_sessions FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        (budtender_id = auth.uid() OR auth.is_manager_or_above())
    );

-- Questionnaire Templates: Dispensary-scoped, managers manage
CREATE POLICY "Users can view templates"
    ON questionnaire_templates FOR SELECT
    USING (
        dispensary_id IS NULL OR -- Global templates
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

CREATE POLICY "Managers can manage templates"
    ON questionnaire_templates FOR ALL
    USING (
        (dispensary_id = auth.user_dispensary_id() OR dispensary_id IS NULL) AND
        auth.is_manager_or_above()
    );

-- Questionnaire Sessions: Staff and patients can view
CREATE POLICY "Staff and patients can view sessions"
    ON questionnaire_sessions FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        patient_id = auth.uid() OR
        auth.is_admin()
    );

CREATE POLICY "Users can create sessions"
    ON questionnaire_sessions FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id()
    );

CREATE POLICY "Users can update own sessions"
    ON questionnaire_sessions FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        (patient_id = auth.uid() OR auth.is_manager_or_above() OR patient_id IS NULL)
    );

-- Product Effects: Staff can view, system manages
CREATE POLICY "Staff can view product effects"
    ON product_effects_tracking FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

CREATE POLICY "System manages product effects"
    ON product_effects_tracking FOR ALL
    USING (auth.is_manager_or_above());

-- Lightspeed Sync Logs: Owners only
CREATE POLICY "Owners can view sync logs"
    ON lightspeed_sync_logs FOR SELECT
    USING (
        (dispensary_id = auth.user_dispensary_id() AND auth.is_owner_or_above()) OR
        auth.is_admin()
    );

CREATE POLICY "System can create sync logs"
    ON lightspeed_sync_logs FOR INSERT
    WITH CHECK (true); -- System/service role creates these

-- ============================================================================
-- PHASE 14: HELPER FUNCTIONS
-- ============================================================================

-- Get product recommendations based on preferences
CREATE OR REPLACE FUNCTION get_product_recommendations(
    p_dispensary_id UUID,
    p_effects effect_type[],
    p_category product_category DEFAULT NULL,
    p_flavors TEXT[] DEFAULT '{}',
    p_price_min DECIMAL DEFAULT 0,
    p_price_max DECIMAL DEFAULT 1000,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    strain_name VARCHAR(255),
    category product_category,
    price DECIMAL(10,2),
    thc_content DECIMAL(5,2),
    cbd_content DECIMAL(5,2),
    match_score INTEGER,
    in_stock BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_products AS (
        SELECT
            p.id,
            p.name as product_name,
            s.name as strain_name,
            p.category,
            p.retail_price,
            p.thc_percentage,
            p.cbd_percentage,
            -- Calculate match score (0-100)
            (
                -- Effect matching (up to 50 points)
                COALESCE(array_length(p_effects & s.primary_effects, 1), 0) * 15 +
                COALESCE(array_length(p_effects & s.secondary_effects, 1), 0) * 8 +
                -- Category match (20 points)
                CASE WHEN p_category IS NULL OR p.category = p_category THEN 20 ELSE 0 END +
                -- Flavor matching (up to 15 points)
                COALESCE(array_length(p_flavors & s.flavors, 1), 0) * 5 +
                -- Historical success rate bonus (up to 15 points)
                COALESCE((
                    SELECT AVG(pet.success_rate)::INTEGER / 7
                    FROM product_effects_tracking pet
                    WHERE pet.product_id = p.id
                    AND pet.effect = ANY(p_effects)
                ), 0)
            ) as score,
            p.quantity_on_hand > 0 as available
        FROM products p
        LEFT JOIN strains s ON p.strain_id = s.id
        WHERE
            p.dispensary_id = p_dispensary_id
            AND p.is_active = true
            AND p.retail_price BETWEEN p_price_min AND p_price_max
            AND (p_category IS NULL OR p.category = p_category)
    )
    SELECT
        sp.id as product_id,
        sp.product_name,
        sp.strain_name,
        sp.category,
        sp.retail_price as price,
        sp.thc_percentage as thc_content,
        sp.cbd_percentage as cbd_content,
        sp.score as match_score,
        sp.available as in_stock
    FROM scored_products sp
    WHERE sp.available = true
    ORDER BY sp.score DESC, sp.retail_price ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if patient's medical card is valid
CREATE OR REPLACE FUNCTION is_medical_card_valid(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT
        is_medical_patient = true
        AND medical_card_expiration IS NOT NULL
        AND medical_card_expiration > CURRENT_DATE
    FROM users
    WHERE id = p_user_id
$$ LANGUAGE sql STABLE;

-- Get recommendation success rate for a budtender
CREATE OR REPLACE FUNCTION get_budtender_recommendation_stats(p_budtender_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    converted_sessions BIGINT,
    conversion_rate DECIMAL(5,2),
    avg_rating DECIMAL(3,2),
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_sessions,
        COUNT(*) FILTER (WHERE converted_to_purchase = true)::BIGINT as converted_sessions,
        CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(*) FILTER (WHERE converted_to_purchase = true)::DECIMAL / COUNT(*) * 100)
            ELSE 0
        END as conversion_rate,
        AVG(patient_feedback_rating)::DECIMAL(3,2) as avg_rating,
        COALESCE(SUM(t.total_amount), 0)::DECIMAL(12,2) as total_revenue
    FROM recommendation_sessions rs
    LEFT JOIN transactions t ON rs.transaction_id = t.id
    WHERE rs.budtender_id = p_budtender_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PHASE 15: GRANTS
-- ============================================================================

-- Grant permissions on new tables
GRANT SELECT ON strains TO authenticated;
GRANT SELECT ON brands TO authenticated;
GRANT SELECT, INSERT, UPDATE ON recommendation_sessions TO authenticated;
GRANT SELECT ON questionnaire_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON questionnaire_sessions TO authenticated;
GRANT SELECT ON product_effects_tracking TO authenticated;
GRANT SELECT ON lightspeed_sync_logs TO authenticated;

-- Service role full access
GRANT ALL ON strains TO service_role;
GRANT ALL ON brands TO service_role;
GRANT ALL ON recommendation_sessions TO service_role;
GRANT ALL ON questionnaire_templates TO service_role;
GRANT ALL ON questionnaire_sessions TO service_role;
GRANT ALL ON product_effects_tracking TO service_role;
GRANT ALL ON lightspeed_sync_logs TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_product_recommendations(UUID, effect_type[], product_category, TEXT[], DECIMAL, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_medical_card_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_budtender_recommendation_stats(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE strains IS 'Master library of cannabis strains with effects, terpenes, and medical uses';
COMMENT ON TABLE brands IS 'Product manufacturers/growers per dispensary';
COMMENT ON TABLE recommendation_sessions IS 'AI-powered recommendation sessions tracking patient preferences and outcomes';
COMMENT ON TABLE questionnaire_templates IS 'Customizable questionnaire templates for patient intake';
COMMENT ON TABLE questionnaire_sessions IS 'Patient responses to questionnaires';
COMMENT ON TABLE product_effects_tracking IS 'Machine learning data for improving recommendations';
COMMENT ON TABLE lightspeed_sync_logs IS 'Audit trail for Lightspeed POS synchronization';

COMMENT ON FUNCTION get_product_recommendations IS 'AI recommendation engine - returns scored product matches based on patient preferences';
COMMENT ON FUNCTION is_medical_card_valid IS 'Check if a patient has a valid unexpired medical card';
COMMENT ON FUNCTION get_budtender_recommendation_stats IS 'Get performance statistics for a budtender';
