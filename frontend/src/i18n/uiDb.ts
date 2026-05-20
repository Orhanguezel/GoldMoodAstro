// =============================================================
// FILE: src/lib/i18n/uiDb.ts  (DYNAMIC - NO HARDCODE LOCALES)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useListSiteSettingsQuery } from '@/integrations/rtk/hooks';
import { useResolvedLocale,UI_FALLBACK_EN } from '@/i18n';
import type { SiteSettingRow } from '@/integrations/shared';
import type { TranslatedLabel } from '@/integrations/shared';

/**
 * DB tarafında kullanacağın section key'leri (site_settings.key)
 */
export type UiSectionKey =
  | 'ui_header'
  | 'ui_home'
  | 'ui_footer'
  | 'ui_banner'
  | 'ui_hero'
  | 'ui_contact'
  | 'ui_about'
  | 'ui_about_stats'
  | 'ui_pricing'
  | 'ui_testimonials'
  | 'ui_faq'
  | 'ui_features'
  | 'ui_cta'
  | 'ui_blog'
  | 'ui_dashboard'
  | 'ui_auth'
  | 'ui_newsletter'
  | 'ui_library'
  | 'ui_feedback'
  | 'ui_references'
  | 'ui_news'
  | 'ui_products'
  | 'ui_spareparts'
  | 'ui_faqs'
  | 'ui_team'
  | 'ui_offer'
  | 'ui_catalog'
  | 'ui_coffee'
  | 'ui_errors'
  | 'ui_cookie'
  | 'ui_cookie_policy'
  | 'ui_quality'
  | 'ui_mission'
  | 'ui_vision'
  | 'ui_kvkk'
  | 'ui_mission_vision'
  | 'ui_legal_notice'
  | 'ui_privacy_notice'
  | 'ui_privacy_policy'
  | 'ui_terms'
  | 'ui_common'
  | 'ui_solutions'
  | 'ui_chat'
  | 'ui_become_consultant'
  | 'ui_reviews'
  | 'ui_boost';

/**
 * UI key listeleri:
 * - Burayı "UI_FALLBACK_EN" içindeki key isimleriyle aynı tut.
 * - UI_KEYS import etmeden burada string[] olarak tanımlarız (TS stabil).
 */
const SECTION_KEYS: Record<UiSectionKey, readonly string[]> = {
  ui_header: [
    'ui_header_nav_home',
    'ui_header_nav_about',
    'ui_header_nav_consultants',
    'ui_header_nav_blog',
    'ui_header_nav_news',
    'ui_header_nav_contact',
    'ui_header_cta',
    'ui_header_open_menu',
    'ui_header_open_sidebar',
    'ui_header_close',
    'ui_header_language',
    'ui_header_auth',
    'ui_header_register',
    'ui_header_search_placeholder',
    'ui_header_search',
    'ui_header_contact_info',
    'ui_header_call',
    'ui_header_email',
  ],

  ui_home: [
    'ui_home_h1',
    'ui_hero_kicker_prefix',
    'ui_hero_kicker_brand',
    'ui_hero_title_fallback',
    'ui_hero_desc_fallback',
    'ui_hero_cta',
    'ui_hero_prev',
    'ui_hero_next',
  ],

  ui_footer: [
    'ui_footer_company',
    'ui_footer_about',
    'ui_footer_blog',
    'ui_footer_resources',
    'ui_footer_free_tools',
    'ui_footer_contact_us',
    'ui_footer_services',
    'ui_footer_service_seo',
    'ui_footer_service_ppc',
    'ui_footer_service_smm',
    'ui_footer_service_link_building',
    'ui_footer_service_cro',
    'ui_footer_explore',
    'ui_footer_account',
    'ui_footer_privacy',
    'ui_footer_affiliate',
    'ui_footer_product_design',
    'ui_footer_web_design',
    'ui_footer_contact',
    'ui_footer_phone_aria',
    'ui_footer_email_aria',
    'ui_footer_copyright_prefix',
    'ui_footer_copyright_suffix',
  ],

  ui_banner: ['ui_breadcrumb_home'],

  ui_hero: [
    'ui_hero_kicker_prefix',
    'ui_hero_kicker_brand',
    'ui_hero_title_fallback',
    'ui_hero_desc_fallback',
    'ui_hero_cta',
    'ui_hero_prev',
    'ui_hero_next',
  ],

  ui_contact: [
    'ui_contact_subprefix',
    'ui_contact_sublabel',
    'ui_contact_title_left',
    'ui_contact_tagline',
    'ui_contact_quick_email_placeholder',
    'ui_contact_form_title',
    'ui_contact_first_name',
    'ui_contact_last_name',
    'ui_contact_company',
    'ui_contact_website',
    'ui_contact_phone',
    'ui_contact_email',
    'ui_contact_select_label',
    'ui_contact_service_cooling_towers',
    'ui_contact_service_maintenance',
    'ui_contact_service_modernization',
    'ui_contact_service_other',
    'ui_contact_terms_prefix',
    'ui_contact_terms',
    'ui_contact_conditions',
    'ui_contact_submit',
    'ui_contact_sending',
    'ui_contact_success',
    'ui_contact_error_generic',
  ],

  ui_about: [
    'ui_about_subprefix',
    'ui_about_sublabel',
    'ui_about_page_title',
    'ui_about_page_lead',
    'ui_about_page_description',
    'ui_about_meta_title',
    'ui_about_meta_description',
    'ui_about_og_image',
    'ui_about_view_all',
    'ui_about_read_more',
    'ui_about_fallback_title',
    'ui_about_empty',
    'ui_about_error',
    'ui_about_empty_text',
    'ui_about_eyebrow',
    'ui_about_title',
    'ui_about_lead',
    'ui_about_founder_title',
    'ui_about_founder_paragraphs',
    'ui_about_methodology_title',
    'ui_about_methodology_paragraphs',
    'ui_about_experience_title',
    'ui_about_experience_paragraphs',
    'ui_about_diff_title',
    'ui_about_diff_items',
    'ui_about_author_bio',
  ],

  ui_about_stats: [
    'ui_about_stats_refs_title',
    'ui_about_stats_projects_title',
    'ui_about_stats_years_title',
  ],

  ui_pricing: [],

  ui_testimonials: [
    'ui_feedback_subprefix',
    'ui_feedback_sublabel',
    'ui_feedback_title',
    'ui_feedback_paragraph',
    'ui_feedback_prev',
    'ui_feedback_next',
    'ui_feedback_role_customer',
  ],

  ui_faq: [],
  ui_features: [],
  ui_cta: [],

  ui_blog: [
    'ui_blog_page_title',
    'ui_blog_detail_page_title',
    'ui_blog_meta_title',
    'ui_blog_meta_description',
    'ui_blog_og_image',
    'ui_blog_loading',
    'ui_blog_not_found',
    'ui_blog_content_soon',
    'ui_blog_author_fallback',
    'ui_blog_author_role_fallback',
    'ui_blog_highlights_title',
    'ui_blog_tags_title',
    'ui_blog_prev_post',
    'ui_blog_next_post',
    'ui_blog_leave_comment',
    'ui_blog_comment_placeholder',
    'ui_blog_comment_name_placeholder',
    'ui_blog_comment_email_placeholder',
    'ui_blog_comment_submit',
    'ui_blog_filter_all',
  ],

  ui_dashboard: [
    'ui_dashboard_accept_now',
    'ui_dashboard_action_instant_request',
    'ui_dashboard_action_pending_booking',
    'ui_dashboard_action_unanswered_message',
    'ui_dashboard_actions_needed',
    'ui_dashboard_add_placeholder',
    'ui_dashboard_approval_status',
    'ui_dashboard_approve',
    'ui_dashboard_auth_required_desc',
    'ui_dashboard_auth_required_title',
    'ui_dashboard_avatar_approval_note',
    'ui_dashboard_avatar_rule_ai',
    'ui_dashboard_avatar_rule_face',
    'ui_dashboard_avatar_rule_reject',
    'ui_dashboard_avatar_rule_single',
    'ui_dashboard_avatar_rule_tip',
    'ui_dashboard_back_home',
    'ui_dashboard_become_consultant',
    'ui_dashboard_blog_content_label',
    'ui_dashboard_blog_cover_url_label',
    'ui_dashboard_blog_delete_confirm',
    'ui_dashboard_blog_delete_failed',
    'ui_dashboard_blog_draft_deleted',
    'ui_dashboard_blog_draft_saved',
    'ui_dashboard_blog_draft_submitted',
    'ui_dashboard_blog_edit_draft',
    'ui_dashboard_blog_empty',
    'ui_dashboard_blog_error_required',
    'ui_dashboard_blog_intro',
    'ui_dashboard_blog_loading_drafts',
    'ui_dashboard_blog_new',
    'ui_dashboard_blog_new_draft',
    'ui_dashboard_blog_pending_admin',
    'ui_dashboard_blog_published',
    'ui_dashboard_blog_save_failed',
    'ui_dashboard_blog_summary_label',
    'ui_dashboard_blog_tags_label',
    'ui_dashboard_blog_tags_placeholder',
    'ui_dashboard_blog_title_label',
    'ui_dashboard_blog_untitled',
    'ui_dashboard_cancel',
    'ui_dashboard_cancel_booking_title',
    'ui_dashboard_cancel_reason_min',
    'ui_dashboard_character_count',
    'ui_dashboard_chart_bar_title',
    'ui_dashboard_consultant_fallback',
    'ui_dashboard_consultant_only_desc',
    'ui_dashboard_consultant_only_title',
    'ui_dashboard_daily_sessions',
    'ui_dashboard_discard',
    'ui_dashboard_error_bio_max',
    'ui_dashboard_error_expertise_max',
    'ui_dashboard_error_fix_fields',
    'ui_dashboard_error_instagram_length',
    'ui_dashboard_error_instagram_url',
    'ui_dashboard_error_languages_max',
    'ui_dashboard_error_linkedin_url',
    'ui_dashboard_error_website_url',
    'ui_dashboard_expertise_astrology',
    'ui_dashboard_expertise_career',
    'ui_dashboard_expertise_hint',
    'ui_dashboard_expertise_label',
    'ui_dashboard_expertise_mood',
    'ui_dashboard_expertise_numerology',
    'ui_dashboard_expertise_relationship',
    'ui_dashboard_expertise_tarot',
    'ui_dashboard_filter_all',
    'ui_dashboard_filter_cancelled',
    'ui_dashboard_filter_completed',
    'ui_dashboard_filter_confirmed',
    'ui_dashboard_filter_instant',
    'ui_dashboard_filter_pending_payment',
    'ui_dashboard_filter_rejected',
    'ui_dashboard_header_desc',
    'ui_dashboard_hours_short',
    'ui_dashboard_instant_alert_desc',
    'ui_dashboard_instant_alert_title',
    'ui_dashboard_language_de',
    'ui_dashboard_language_en',
    'ui_dashboard_language_fr',
    'ui_dashboard_language_tr',
    'ui_dashboard_languages_hint',
    'ui_dashboard_languages_label',
    'ui_dashboard_last_7_days',
    'ui_dashboard_greeting',
    'ui_dashboard_page_title',
    'ui_dashboard_view_profile',
    'ui_dashboard_consultant_fallback',
    'ui_dashboard_status_approved',
    'ui_dashboard_status_pending_review',
    'ui_dashboard_status_rejected',
    'ui_dashboard_live_preview',
    'ui_dashboard_loading',
    'ui_dashboard_message',
    'ui_dashboard_minutes_short',
    'ui_dashboard_modal_cancel_desc',
    'ui_dashboard_modal_notes_desc',
    'ui_dashboard_modal_reject_desc',
    'ui_dashboard_no_bookings_filter',
    'ui_dashboard_notes',
    'ui_dashboard_notes_placeholder',
    'ui_dashboard_offline',
    'ui_dashboard_online',
    'ui_dashboard_platforms_hint',
    'ui_dashboard_platforms_label',
    'ui_dashboard_preview_note',
    'ui_dashboard_profile_bio_hint',
    'ui_dashboard_profile_bio_label',
    'ui_dashboard_profile_save_failed',
    'ui_dashboard_profile_saved',
    'ui_dashboard_quick_actions',
    'ui_dashboard_quick_add_service',
    'ui_dashboard_quick_edit_availability',
    'ui_dashboard_quick_edit_profile',
    'ui_dashboard_quick_view_messages',
    'ui_dashboard_reason_label',
    'ui_dashboard_reason_placeholder',
    'ui_dashboard_reject',
    'ui_dashboard_reject_booking_title',
    'ui_dashboard_reject_reason_min',
    'ui_dashboard_save',
    'ui_dashboard_save_profile',
    'ui_dashboard_saving',
    'ui_dashboard_session_note_label',
    'ui_dashboard_session_note_title',
    'ui_dashboard_show',
    'ui_dashboard_sign_in',
    'ui_dashboard_social_links_hint',
    'ui_dashboard_social_links_label',
    'ui_dashboard_start_call',
    'ui_dashboard_stat_last_month_count',
    'ui_dashboard_stat_last_month_money',
    'ui_dashboard_stat_month_earnings',
    'ui_dashboard_stat_month_sessions',
    'ui_dashboard_stat_rating',
    'ui_dashboard_stat_response_sub',
    'ui_dashboard_stat_response_time',
    'ui_dashboard_stat_reviews_count',
    'ui_dashboard_stats_loading',
    'ui_dashboard_status_approved',
    'ui_dashboard_status_cancelled',
    'ui_dashboard_status_completed',
    'ui_dashboard_status_confirmed',
    'ui_dashboard_status_pending',
    'ui_dashboard_status_pending_payment',
    'ui_dashboard_status_pending_review',
    'ui_dashboard_status_rejected',
    'ui_dashboard_status_requested_now',
    'ui_dashboard_tab_availability',
    'ui_dashboard_tab_blog',
    'ui_dashboard_tab_bookings',
    'ui_dashboard_tab_clients',
    'ui_dashboard_tab_analytics',
    'ui_dashboard_tab_messages',
    'ui_dashboard_tab_overview',
    'ui_dashboard_tab_profile',
    'ui_dashboard_tab_reviews',
    'ui_dashboard_tab_services',
    'ui_dashboard_tab_wallet',
    'ui_dashboard_time_expired',
    'ui_dashboard_title',
    'ui_dashboard_toast_action_failed',
    'ui_dashboard_toast_approve_failed',
    'ui_dashboard_toast_approved',
    'ui_dashboard_toast_cancelled',
    'ui_dashboard_toast_note_saved',
    'ui_dashboard_toast_offline',
    'ui_dashboard_toast_online',
    'ui_dashboard_toast_rejected',
    'ui_dashboard_toast_update_failed',
    'ui_dashboard_activate',
    'ui_dashboard_deactivate',
    'ui_dashboard_delete',
    'ui_dashboard_delete_failed',
    'ui_dashboard_deleted',
    'ui_dashboard_free',
    'ui_dashboard_move_down',
    'ui_dashboard_move_up',
    'ui_dashboard_save_changes',
    'ui_dashboard_save_failed',
    'ui_dashboard_saved',
    'ui_dashboard_service_create_failed',
    'ui_dashboard_service_created',
    'ui_dashboard_service_delete_confirm',
    'ui_dashboard_service_description',
    'ui_dashboard_service_description_placeholder',
    'ui_dashboard_service_duration_minutes',
    'ui_dashboard_service_duration_placeholder',
    'ui_dashboard_service_error_duration_range',
    'ui_dashboard_service_error_name_empty',
    'ui_dashboard_service_error_name_required',
    'ui_dashboard_service_error_one_active',
    'ui_dashboard_service_error_price_range',
    'ui_dashboard_service_free_intro',
    'ui_dashboard_service_media_audio',
    'ui_dashboard_service_media_audio_call',
    'ui_dashboard_service_media_type',
    'ui_dashboard_service_media_video',
    'ui_dashboard_service_media_video_call',
    'ui_dashboard_service_name',
    'ui_dashboard_service_name_placeholder',
    'ui_dashboard_service_new',
    'ui_dashboard_service_order_failed',
    'ui_dashboard_service_order_updated',
    'ui_dashboard_service_price',
    'ui_dashboard_service_price_placeholder',
    'ui_dashboard_service_slug_admin',
    'ui_dashboard_service_slug_placeholder',
    'ui_dashboard_service_template_add_failed',
    'ui_dashboard_service_template_added',
    'ui_dashboard_service_template_added_badge',
    'ui_dashboard_service_template_use',
    'ui_dashboard_service_templates_desc',
    'ui_dashboard_service_templates_title',
    'ui_dashboard_services_empty',
    'ui_dashboard_services_intro',
    'ui_dashboard_status_active',
    'ui_dashboard_status_inactive',
    'ui_dashboard_total_reviews',
    'ui_dashboard_total_sessions',
    'ui_dashboard_total_sessions_inline',
    'ui_dashboard_service_boost_active',
    'ui_dashboard_service_boost_title',
    'ui_dashboard_service_boost_btn',
  ],

  ui_auth: [
    'ui_auth_title',
    'ui_auth_lead',
    'ui_auth_register_link',
    'ui_auth_email_label',
    'ui_auth_email_placeholder',
    'ui_auth_password_label',
    'ui_auth_password_placeholder',
    'ui_auth_remember_me',
    'ui_auth_submit',
    'ui_auth_loading',
    'ui_auth_or',
    'ui_auth_google_button',
    'ui_auth_google_loading',
    'ui_auth_error_required',
    'ui_auth_error_google_generic',
  ],

  ui_newsletter: [
    'ui_newsletter_title',
    'ui_newsletter_desc',
    'ui_newsletter_cta',
    'ui_newsletter_ok',
    'ui_newsletter_fail',
    'ui_newsletter_placeholder',
    'ui_newsletter_section_aria',
    'ui_newsletter_email_aria',
  ],

  ui_library: [
    'ui_library_subprefix',
    'ui_library_sublabel',
    'ui_library_title_prefix',
    'ui_library_title_mark',
    'ui_library_view_detail',
    'ui_library_view_detail_aria',
    'ui_library_view_all',
    'ui_library_untitled',
    'ui_library_sample_one',
    'ui_library_sample_two',
  ],

  ui_feedback: [
    'ui_feedback_subprefix',
    'ui_feedback_sublabel',
    'ui_feedback_title',
    'ui_feedback_paragraph',
    'ui_feedback_prev',
    'ui_feedback_next',
    'ui_feedback_role_customer',
  ],

  ui_references: [
    'ui_references_subprefix',
    'ui_references_sublabel',
    'ui_references_title',
    'ui_references_view_all',
  ],

  ui_news: [
    'ui_news_subprefix',
    'ui_news_sublabel',
    'ui_news_title_prefix',
    'ui_news_title_mark',
    'ui_news_read_more',
    'ui_news_read_more_aria',
    'ui_news_view_all',
    'ui_news_untitled',
    'ui_news_sample_one',
    'ui_news_sample_two',
  ],

  ui_products: [
    'ui_products_kicker_prefix',
    'ui_products_kicker_label',
    'ui_products_title_prefix',
    'ui_products_title_mark',
    'ui_products_read_more',
    'ui_products_read_more_aria',
    'ui_products_price_label',
    'ui_products_view_all',
    'ui_products_empty',
  ],

  ui_spareparts: [
    'ui_spareparts_kicker_prefix',
    'ui_spareparts_kicker_label',
    'ui_spareparts_title_prefix',
    'ui_spareparts_title_mark',
    'ui_spareparts_read_more',
    'ui_spareparts_read_more_aria',
    'ui_spareparts_price_label',
    'ui_spareparts_view_all',
    'ui_spareparts_empty',
  ],

  ui_faqs: ['ui_faqs_page_title'],
  ui_team: ['ui_team_page_title'],
  ui_offer: ['ui_offer_page_title'],
  ui_catalog: ['ui_catalog_page_title'],
  ui_coffee: ['ui_coffee_upload_failed'],

  ui_cookie: [
    'ui_cookie_title',
    'ui_cookie_description',
    'ui_cookie_label_necessary',
    'ui_cookie_desc_necessary',
    'ui_cookie_label_analytics',
    'ui_cookie_desc_analytics',
    'ui_cookie_btn_cancel',
    'ui_cookie_btn_save',
  ],

  ui_errors: [
    'ui_404_title',
    'ui_404_subtitle',
    'ui_404_back_home',
    'ui_404_go_back',
    'ui_404_redirect_info',
    'ui_500_title',
    'ui_500_subtitle',
    'ui_500_try_again',
    'ui_generic_error',
    'ui_loading',
  ],
  ui_cookie_policy: ['ui_cookie_policy_page_title'],
  ui_quality: ['ui_quality_meta_title', 'ui_quality_meta_description'],
  ui_mission_vision: ['ui_mission_vision_meta_title', 'ui_mission_vision_meta_description'],
  ui_mission: ['ui_mission_page_title', 'ui_mission_meta_title', 'ui_mission_meta_description'],
  ui_vision: ['ui_vision_page_title', 'ui_vision_meta_title', 'ui_vision_meta_description'],
  ui_kvkk: [
    'ui_kvkk_page_title',
    'ui_kvkk_meta_title',
    'ui_kvkk_meta_description',
    'ui_kvkk_empty',
    'ui_kvkk_empty_text',
  ],
  ui_legal_notice: [
    'ui_legal_notice_page_title',
    'ui_legal_notice_meta_title',
    'ui_legal_notice_meta_description',
    'ui_legal_notice_empty',
    'ui_legal_notice_empty_text',
  ],
  ui_privacy_notice: [
    'ui_privacy_notice_page_title',
    'ui_privacy_notice_meta_title',
    'ui_privacy_notice_meta_description',
    'ui_privacy_notice_empty',
    'ui_privacy_notice_empty_text',
  ],
  ui_privacy_policy: [
    'ui_privacy_policy_page_title',
    'ui_privacy_policy_meta_title',
    'ui_privacy_policy_meta_description',
    'ui_privacy_policy_empty',
    'ui_privacy_policy_empty_text',
  ],
  ui_terms: [
    'ui_terms_page_title',
    'ui_terms_meta_title',
    'ui_terms_meta_description',
    'ui_terms_empty',
    'ui_terms_empty_text',
  ],
  ui_common: [
    'ui_common_read_more',
    'ui_common_read_less',
    'ui_common_loading',
    'ui_common_error_generic',
  ],
  ui_solutions: [
    'ui_solutions_page_title',
    'ui_solutions_meta_title',
    'ui_solutions_meta_description',
  ],
  ui_chat: [
    'ui_chat_title',
    'ui_chat_subtitle',
    'ui_chat_placeholder',
    'ui_chat_send',
    'ui_chat_connect_admin',
    'ui_chat_connecting',
    'ui_chat_login_title',
    'ui_chat_login_button',
    'ui_chat_loading',
    'ui_chat_ai_mode',
    'ui_chat_admin_mode',
    'ui_chat_admin_inbox',
    'ui_chat_no_admin_threads',
    'ui_chat_thread_label',
    'ui_chat_queue_pending',
    'ui_chat_queue_mine',
    'ui_chat_queue_all',
    'ui_chat_unread_label',
    'ui_chat_empty',
  ],
  ui_become_consultant: [
    'ui_become_consultant_sparkle',
    'ui_become_consultant_h1_part1',
    'ui_become_consultant_h1_part2',
    'ui_become_consultant_lead',
    'ui_become_consultant_benefit1_title',
    'ui_become_consultant_benefit1_desc',
    'ui_become_consultant_benefit2_title',
    'ui_become_consultant_benefit2_desc',
    'ui_become_consultant_benefit3_title',
    'ui_become_consultant_benefit3_desc',
    'ui_become_consultant_start_btn',
    'ui_become_consultant_eval_note',
    'ui_become_consultant_back',
    'ui_become_consultant_step2_title',
    'ui_become_consultant_form_section1',
    'ui_become_consultant_form_name',
    'ui_become_consultant_form_email',
    'ui_become_consultant_form_phone',
    'ui_become_consultant_form_experience',
    'ui_become_consultant_form_section2',
    'ui_become_consultant_form_expertise',
    'ui_become_consultant_form_languages',
    'ui_become_consultant_form_section3',
    'ui_become_consultant_form_bio',
    'ui_become_consultant_form_bio_hint',
    'ui_become_consultant_form_bio_placeholder',
    'ui_become_consultant_form_avatar_note',
    'ui_become_consultant_form_certs',
    'ui_become_consultant_form_certs_placeholder',
    'ui_become_consultant_form_cv',
    'ui_become_consultant_form_cv_desc',
    'ui_become_consultant_form_sample',
    'ui_become_consultant_form_sample_desc',
    'ui_become_consultant_form_commission',
    'ui_become_consultant_form_commission_desc',
    'ui_become_consultant_form_terms_pre',
    'ui_become_consultant_form_terms_link',
    'ui_become_consultant_form_terms_post',
    'ui_become_consultant_submit',
    'ui_become_consultant_success_title',
    'ui_become_consultant_success_desc',
    'ui_become_consultant_success_back',
    'ui_become_consultant_error_size',
    'ui_become_consultant_success_upload',
    'ui_become_consultant_error_upload',
    'ui_become_consultant_upload_ok',
    'ui_become_consultant_error_generic',
    'ui_become_consultant_error_expertise',
    'ui_become_consultant_error_language',
    'ui_become_consultant_error_terms',
    'ui_become_consultant_success_toast',
  ],
  ui_reviews: [
    'ui_reviews_filter_all',
    'ui_reviews_filter_unreplied',
    'ui_reviews_filter_low',
    'ui_reviews_filter_high',
    'ui_reviews_filter_label',
    'ui_reviews_loading',
    'ui_reviews_error',
    'ui_reviews_empty',
    'ui_reviews_empty_hint',
    'ui_reviews_no_comment',
    'ui_reviews_consultant_reply_label',
    'ui_reviews_edit_reply',
    'ui_reviews_write_reply',
    'ui_reviews_reply_placeholder',
    'ui_reviews_draft_suggestion',
    'ui_reviews_draft_ready',
    'ui_reviews_cancel',
    'ui_reviews_publish',
    'ui_reviews_update',
    'ui_reviews_reply_saved',
    'ui_reviews_reply_failed',
    'ui_reviews_hidden_user',
    'ui_reviews_no_date',
    'ui_reviews_suggestion_low',
    'ui_reviews_suggestion_high',
  ],
  ui_boost: [
    'ui_boost_title',
    'ui_boost_desc',
    'ui_boost_days_label',
    'ui_boost_one_time',
    'ui_boost_note',
    'ui_boost_cancel',
    'ui_boost_buy',
    'ui_boost_payment_error',
    'ui_boost_buy_failed',
    'ui_boost_active_badge',
    'ui_boost_days_left',
    'ui_boost_btn_label',
    'ui_boost_btn_title',
  ],
};

export type UiSectionResult = {
  ui: (key: string, hardFallback?: string) => string;
  raw: Record<string, unknown>;
  locale: string; // ✅ dynamic
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function unwrapMaybeData(x: any): any {
  if (!x) return x;
  if (typeof x !== 'object' || Array.isArray(x)) return x;
  if ('data' in x) return (x as any).data;
  if ('value' in x) return (x as any).value;
  return x;
}

function tryParseJsonObject(input: unknown): Record<string, unknown> {
  const x = unwrapMaybeData(input);
  if (!x) return {};
  if (typeof x === 'object' && !Array.isArray(x)) return x as Record<string, unknown>;
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return {};
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const j = JSON.parse(s);
        if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>;
      } catch {
        return {};
      }
    }
  }
  return {};
}

function tryParseJson(x: unknown): unknown {
  if (typeof x !== 'string') return x;
  const s = x.trim();
  if (!s) return x;
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return x;
    }
  }
  return x;
}

function normShortLocale(x: unknown): string {
  return String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

type SettingsValueRecord = { label?: TranslatedLabel; [k: string]: unknown };

function normalizeValueToLabel(value: unknown): SettingsValueRecord {
  const v = tryParseJson(value);
  if (typeof v === 'string') return { label: { en: v } as TranslatedLabel };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as any;
    if (obj.label && typeof obj.label === 'object' && !Array.isArray(obj.label)) return obj;
    return { label: obj as TranslatedLabel };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/*  useUiSection — TÜM ui_* key'leri TEK istek ile çeker              */
/*  RTK Query deduplication: tüm section'lar aynı cache'i paylaşır    */
/* ------------------------------------------------------------------ */

export function useUiSection(section: UiSectionKey, localeOverride?: string): UiSectionResult {
  const locale = useResolvedLocale(localeOverride);

  // ✅ TEK istek: GET /site_settings?prefix=ui_&locale=de
  // RTK Query tüm useUiSection çağrılarını deduplicate eder (aynı args).
  const { data: allUiSettings } = useListSiteSettingsQuery(
    locale ? { prefix: 'ui_', locale } : undefined,
  );

  // Hızlı lookup Map (tüm ui_* satırları)
  const allUiMap = useMemo(() => {
    const m = new Map<string, SiteSettingRow>();
    if (allUiSettings) {
      for (const row of allUiSettings) m.set(row.key, row);
    }
    return m;
  }, [allUiSettings]);

  // 1) Section bazlı JSON override (ui_header, ui_footer, ...)
  const json = useMemo<Record<string, unknown>>(() => {
    const row = allUiMap.get(section);
    return row ? tryParseJsonObject(row.value) : {};
  }, [allUiMap, section]);

  // 2) Tekil key'ler (ui_header_nav_home gibi) → label extraction
  const keys = SECTION_KEYS[section] ?? [];
  const keyMap = useMemo(() => {
    const out: Record<string, SettingsValueRecord> = {};
    for (const k of keys) {
      const row = allUiMap.get(k);
      if (row) out[k] = normalizeValueToLabel(row.value);
    }
    return out;
  }, [allUiMap, keys]);

  const ui = (key: string, hardFallback = ''): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    // A) section JSON override
    const raw = json[k];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();

    // B) tekil UI key DB
    const record = keyMap[k];
    if (record) {
      const label = (record.label || {}) as TranslatedLabel;
      const l = normShortLocale(locale);
      const val =
        (l && (label as any)[l]) ||
        (label as any).en ||
        (label as any).tr ||
        (Object.values(label || {})[0] as string) ||
        '';
      const fromDb = (typeof val === 'string' ? val : '').trim();
      if (fromDb && fromDb !== k) return fromDb;
    }

    // C) param hard fallback
    const hf = String(hardFallback || '').trim();
    if (hf) return hf;

    // D) constant EN fallback
    const fromConst = (UI_FALLBACK_EN as any)[k];
    if (typeof fromConst === 'string' && fromConst.trim()) return fromConst.trim();

    // E) key
    return k;
  };

  return { ui, raw: json, locale };
}
