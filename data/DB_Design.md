-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.flyway_schema_history (
  installed_rank integer NOT NULL,
  version character varying,
  description character varying NOT NULL,
  type character varying NOT NULL,
  script character varying NOT NULL,
  checksum integer,
  installed_by character varying NOT NULL,
  installed_on timestamp without time zone NOT NULL DEFAULT now(),
  execution_time integer NOT NULL,
  success boolean NOT NULL,
  CONSTRAINT flyway_schema_history_pkey PRIMARY KEY (installed_rank)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.home_banner (
  id bigint NOT NULL DEFAULT nextval('home_banner_id_seq'::regclass),
  image_url text NOT NULL,
  link_url text,
  title text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT home_banner_pkey PRIMARY KEY (id)
);
CREATE TABLE public.brand_logo (
  brand_name text NOT NULL,
  logo_url text NOT NULL,
  website_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT brand_logo_pkey PRIMARY KEY (brand_name)
);
CREATE TABLE public.home_featured_category (
  id bigint NOT NULL DEFAULT nextval('home_featured_category_id_seq'::regclass),
  category_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  accent_color text,
  icon_name text,
  banner_url text,
  section_title text,
  CONSTRAINT home_featured_category_pkey PRIMARY KEY (id),
  CONSTRAINT home_featured_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.home_featured_category_pinned_product (
  featured_category_id bigint NOT NULL,
  product_id uuid NOT NULL,
  CONSTRAINT home_featured_category_pinned_product_pkey PRIMARY KEY (featured_category_id, product_id),
  CONSTRAINT home_featured_category_pinned_product_featured_category_id_fkey FOREIGN KEY (featured_category_id) REFERENCES public.home_featured_category(id),
  CONSTRAINT home_featured_category_pinned_product_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.home_featured_category_pinned_brand (
  featured_category_id bigint NOT NULL,
  brand_name text NOT NULL,
  CONSTRAINT home_featured_category_pinned_brand_pkey PRIMARY KEY (featured_category_id, brand_name),
  CONSTRAINT home_featured_category_pinned_brand_featured_category_id_fkey FOREIGN KEY (featured_category_id) REFERENCES public.home_featured_category(id),
  CONSTRAINT home_featured_category_pinned_brand_brand_name_fkey FOREIGN KEY (brand_name) REFERENCES public.brand_logo(brand_name)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying,
  auth_provider character varying NOT NULL DEFAULT 'LOCAL'::character varying CHECK (auth_provider::text = ANY (ARRAY['LOCAL'::character varying, 'GOOGLE'::character varying, 'FACEBOOK'::character varying]::text[])),
  provider_user_id character varying,
  role_id uuid NOT NULL,
  full_name character varying,
  email_notif boolean NOT NULL DEFAULT true,
  push_notif boolean NOT NULL DEFAULT true,
  system_notif boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  email_verified boolean NOT NULL DEFAULT false,
  phone character varying,
  locked_reason character varying,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  token_hash character varying NOT NULL UNIQUE,
  device_info character varying,
  ip_address character varying,
  expires_at timestamp with time zone NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT refresh_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.otp_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  otp_hash character varying NOT NULL,
  purpose character varying NOT NULL CHECK (purpose::text = ANY (ARRAY['REGISTER'::character varying, 'RESET_PASSWORD'::character varying]::text[])),
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT otp_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT otp_verifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.rag_config (
  id bigint NOT NULL DEFAULT 1,
  top_k_retrieve integer NOT NULL DEFAULT 20 CHECK (top_k_retrieve >= 5 AND top_k_retrieve <= 50),
  top_k_final integer NOT NULL DEFAULT 5 CHECK (top_k_final >= 1 AND top_k_final <= 10),
  min_similarity numeric NOT NULL DEFAULT 0.60 CHECK (min_similarity >= 0.0 AND min_similarity <= 1.0),
  hybrid_alpha numeric NOT NULL DEFAULT 0.50 CHECK (hybrid_alpha >= 0.0 AND hybrid_alpha <= 1.0),
  llm_temperature numeric NOT NULL DEFAULT 0.10 CHECK (llm_temperature >= 0.0 AND llm_temperature <= 1.0),
  allow_price_query boolean NOT NULL DEFAULT true,
  allow_warranty_query boolean NOT NULL DEFAULT true,
  allow_compare boolean NOT NULL DEFAULT true,
  allow_recommendation boolean NOT NULL DEFAULT true,
  system_prompt_prefix text NOT NULL DEFAULT ''::text,
  response_language text NOT NULL DEFAULT 'vi'::text CHECK (response_language = ANY (ARRAY['vi'::text, 'en'::text, 'auto'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT rag_config_pkey PRIMARY KEY (id),
  CONSTRAINT fk_rag_config_updated_by FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.knowledge_base (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['faq'::text, 'policy'::text, 'warranty'::text, 'guide'::text])),
  embedding USER-DEFINED,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT knowledge_base_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_base_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.query_cache (
  query_hash text NOT NULL,
  query_text text NOT NULL,
  response jsonb NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT query_cache_pkey PRIMARY KEY (query_hash)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  recipient_name character varying NOT NULL,
  phone character varying NOT NULL,
  province character varying NOT NULL,
  district character varying NOT NULL,
  ward character varying NOT NULL,
  detail_address character varying NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  note character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  parent_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  brand character varying,
  origin character varying,
  thumbnail text,
  category_id uuid NOT NULL,
  warranty_months integer,
  custom_tabs jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating_avg numeric NOT NULL DEFAULT 0 CHECK (rating_avg >= 0::numeric AND rating_avg <= 5::numeric),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  sold_quantity integer NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  use_case character varying,
  discount_percent numeric CHECK (discount_percent IS NULL OR discount_percent >= 0::numeric AND discount_percent <= 100::numeric),
  source_url character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  sku character varying NOT NULL UNIQUE,
  variant_name character varying,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  vat_percent numeric NOT NULL DEFAULT 0,
  image text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  is_active boolean NOT NULL DEFAULT true,
  discount_percent numeric CHECK (discount_percent IS NULL OR discount_percent >= 0::numeric AND discount_percent <= 100::numeric),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaign_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  discount_type character varying NOT NULL CHECK (discount_type::text = ANY (ARRAY['PERCENT'::character varying, 'FIXED_AMOUNT'::character varying]::text[])),
  discount_value numeric NOT NULL CHECK (discount_value >= 0::numeric),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  CONSTRAINT campaign_items_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_items_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  description text,
  discount_type character varying NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value >= 0::numeric),
  max_discount_amount numeric,
  min_order_value numeric NOT NULL DEFAULT 0 CHECK (min_order_value >= 0::numeric),
  max_usage integer CHECK (max_usage IS NULL OR max_usage > 0),
  max_usage_per_user integer NOT NULL DEFAULT 1 CHECK (max_usage_per_user > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  campaign_id uuid,
  CONSTRAINT vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT vouchers_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  address_id uuid,
  voucher_id uuid,
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0::numeric),
  customer_name character varying NOT NULL,
  customer_email character varying,
  customer_phone character varying NOT NULL,
  shipping_address character varying NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  status character varying NOT NULL DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'RETURNED'::character varying]::text[])),
  payment_method character varying NOT NULL CHECK (payment_method::text = ANY (ARRAY['COD'::character varying, 'STRIPE'::character varying, 'VNPAY'::character varying]::text[])),
  payment_status character varying NOT NULL DEFAULT 'PENDING'::character varying CHECK (payment_status::text = ANY (ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying]::text[])),
  tracking_number character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase numeric NOT NULL CHECK (price_at_purchase >= 0::numeric),
  attributes_snapshot jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.voucher_usages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL,
  order_id uuid NOT NULL,
  profile_id uuid,
  discount_amount numeric NOT NULL,
  used_at timestamp without time zone NOT NULL DEFAULT now(),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT voucher_usages_pkey PRIMARY KEY (id),
  CONSTRAINT voucher_usages_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id),
  CONSTRAINT voucher_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT voucher_usages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  provider character varying NOT NULL,
  provider_transaction_id character varying,
  amount numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying]::text[])),
  raw_payload text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  paid_at timestamp without time zone,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.system_configs (
  config_key character varying NOT NULL,
  config_value text NOT NULL,
  value_type character varying NOT NULL DEFAULT 'STRING'::character varying,
  description text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT system_configs_pkey PRIMARY KEY (config_key),
  CONSTRAINT system_configs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id character varying,
  summary character varying NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address character varying,
  user_agent character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.customer_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_code character varying NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'PENDING'::character varying,
  payment_status character varying NOT NULL DEFAULT 'UNPAID'::character varying,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0::numeric),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0::numeric),
  shipping_fee numeric NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0::numeric),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0::numeric),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  promotion_code character varying,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT customer_orders_pkey PRIMARY KEY (id),
  CONSTRAINT customer_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  from_status character varying,
  to_status character varying NOT NULL,
  note character varying,
  actor_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.customer_orders(id),
  CONSTRAINT order_status_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL,
  movement_type character varying NOT NULL,
  quantity_delta integer NOT NULL,
  quantity_after integer NOT NULL CHECK (quantity_after >= 0),
  reason character varying NOT NULL,
  reference_type character varying,
  reference_id character varying,
  actor_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_movements_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT inventory_movements_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  discount_type character varying NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value >= 0::numeric),
  max_discount_amount numeric,
  minimum_order_amount numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamp without time zone NOT NULL,
  ends_at timestamp without time zone NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.warranty_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  warranty_code character varying NOT NULL UNIQUE,
  order_item_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying,
  starts_at timestamp without time zone NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  serial_number character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  CONSTRAINT warranty_cards_pkey PRIMARY KEY (id),
  CONSTRAINT warranty_cards_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id),
  CONSTRAINT warranty_cards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.warranty_histories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  warranty_card_id uuid NOT NULL,
  status character varying NOT NULL,
  description text NOT NULL,
  resolution text,
  extra_cost numeric NOT NULL DEFAULT 0,
  expected_return_at timestamp without time zone,
  actor_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT warranty_histories_pkey PRIMARY KEY (id),
  CONSTRAINT warranty_histories_warranty_card_id_fkey FOREIGN KEY (warranty_card_id) REFERENCES public.warranty_cards(id),
  CONSTRAINT warranty_histories_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  thumbnail character varying,
  status character varying NOT NULL DEFAULT 'DRAFT'::character varying,
  published_at timestamp with time zone,
  seo_title character varying,
  seo_description character varying,
  author_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT news_pkey PRIMARY KEY (id),
  CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.rag_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  status character varying NOT NULL DEFAULT 'ACTIVE'::character varying,
  started_at timestamp without time zone NOT NULL DEFAULT now(),
  ended_at timestamp without time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT rag_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT rag_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.rag_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role character varying NOT NULL,
  content text NOT NULL,
  confidence numeric,
  sources jsonb DEFAULT '[]'::jsonb,
  suggested_products jsonb DEFAULT '[]'::jsonb,
  provider character varying NOT NULL DEFAULT 'mock'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT rag_messages_pkey PRIMARY KEY (id),
  CONSTRAINT rag_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.rag_conversations(id)
);
CREATE TABLE public.rag_feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating = ANY (ARRAY[1, '-1'::integer])),
  note text,
  created_by uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT rag_feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT rag_feedbacks_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.rag_messages(id),
  CONSTRAINT rag_feedbacks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.rag_unanswered_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  question text NOT NULL,
  confidence numeric,
  category character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT rag_unanswered_questions_pkey PRIMARY KEY (id),
  CONSTRAINT rag_unanswered_questions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.rag_conversations(id)
);
CREATE TABLE public.product_attribute_values (
  id bigint NOT NULL DEFAULT nextval('product_specifications_id_seq'::regclass),
  product_id uuid NOT NULL,
  spec_group character varying,
  spec_value character varying NOT NULL,
  spec_unit character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  attribute_key_id integer NOT NULL,
  CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id),
  CONSTRAINT product_specifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_attribute_values_attribute_key_id_fkey FOREIGN KEY (attribute_key_id) REFERENCES public.product_attribute_keys(id)
);
CREATE TABLE public.product_chunks (
  id character varying NOT NULL,
  product_id uuid NOT NULL,
  content text NOT NULL,
  chunk_type character varying NOT NULL DEFAULT 'text'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT product_chunks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_attribute_keys (
  id integer NOT NULL DEFAULT nextval('product_attribute_keys_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  display_name character varying,
  unit character varying,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT product_attribute_keys_pkey PRIMARY KEY (id)
);