// DEV Env...
'use strict'
const env = process.env
const fs = require('fs')
const packageObj = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const __envIn = 'dev';
// const __envIn = 'newStaging';

// const __envIn = 'preprod';


let devEnvVariables = {
  uci_service_base_url: env.uci_service_base_url || "http://uci-service:9999",
  api_base_url: env.api_base_url || "http://localhost:3000",
  CHAT_SECRET_KEY:
    env.CHAT_SECRET_KEY ||
    "bd90f5060a6cb9d1d644e972d517c8c2abdaaee2da2e3b32d332d15c9e2da3da",

  CRON_TIME: env.CRON_TIME || "0 0 * * *",
  NOTIFICATION_CRON_TIME: env.NOTIFICATION_CRON_TIME || "30 11,13,15 * * *",
  EMAIL_HOST: env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: env.EMAIL_PORT || "465",
  EMAIL_FROM: env.EMAIL_FROM || "noreply@nulp.com",
  EMAIL_USER: env.EMAIL_USER || "manoj_n@tekditechnologies.com",
  EMAIL_PASS: env.EMAIL_PASS || "rwrs mdkh hlug rams",
  NAVIGATE_URL: env.NAVIGATE_URL || "https://nulp.niua.org/resources",
  //Redirect and ErrorCallback domain
  REDIRECT_ERROR_CALLBACK_DOMAIN:
    env.portal_redirect_error_callback_domain ||
    "http://localhost,https://nulp.niua.org",
  ML_SERVICE_BASE_URL:
    env.ML_SERVICE_BASE_URL || "https://survey.preprod.ntp.net.in/staging",
  GOOGLE_OAUTH_CONFIG_IOS: {
    clientId: '' || env.sunbird_google_oauth_ios_clientId,
    clientSecret: ''||env.sunbird_google_oauth_ios_clientSecret
  },
  KEYCLOAK_GOOGLE_IOS_CLIENT: {
    clientId: env.sunbird_google_oauth_ios_clientId,
    secret: env.sunbird_trampoline_desktop_keycloak_secret
  },
  ML_SERVICE_BASE_URL: env.ML_SERVICE_BASE_URL || "https://survey.preprod.ntp.net.in/staging",
  ML_URL: {
    OBSERVATION_URL: ''
  },
  PORTAL_SESSION_SECRET_KEY: "sunbird,717b3357-b2b1-4e39-9090-1c712d1b8b64".split(','),

  sunbird_device_api: env.sunbird_device_api || 'https://devnulp.niua.org/api/',
   sunbird_azure_resourceBundle_container_name: env.sunbird_azure_resourceBundle_container_name || 'label',
  LEARNER_URL: env.sunbird_learner_player_url || 'https://devnulp.niua.org/api/',
  CONTENT_URL: env.sunbird_content_player_url || 'https://devnulp.niua.org/api/',
  CONFIG_URL: env.sunbird_config_service_url || 'https://devnulp.niua.org/api/config/',
  CONFIG_REFRESH_INTERVAL: env.config_refresh_interval || 10,
  sunbird_kid_public_key_base_path: env.sunbird_kid_public_key_base_path || '/keys/',
  // discussion forum
  discussion_forum_token: env.discussion_forum_token || 'a4838b88-6a04-4293-a504-245862cad404',
  //discussions_middleware: env.discussions_middleware || 'http://disussionsmw-service:3002/discussion',
  discussions_middleware: env.discussions_middleware || 'http://localhost:3002',

  CONFIG_SERVICE_ENABLED: env.config_service_enabled || false,
  CONTENT_PROXY_URL: 'https://devnulp.niua.org',
  // CONTENT_PROXY_URL: env.sunbird_content_proxy_url || 'https://devnulp.niua.org/',
  PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
  PORTAL_AUTH_SERVER_URL: env.sunbird_portal_auth_server_url || 'https://devnulp.niua.org/auth',
  PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
  APPID: process.env.sunbird_environment + '.' + process.env.sunbird_instance + '.portal',
  DEFAULT_CHANNEL: env.sunbird_default_channel || 'tn',
  sunbird_super_admin_slug: env.sunbird_super_admin_slug || 'sunbird',
  EKSTEP_ENV: env.ekstep_env || 'qa',
  PORTAL_PORT: env.sunbird_port || 3000,
  learner_Service_Local_BaseUrl: 'http://11.2.6.6/',
  REPORT_SERVICE_URL: env.sunbird_report_service_url || 'https://staging.open-sunbird.org/api/data/v1/report-service',
  sunbird_data_product_service: env.sunbird_data_product_service || 'https://staging.ntp.net.in/',

  // REPORT_SERVICE_URL: "http://localhost:3030" || env.sunbird_report_service_url || 'https://staging.open-sunbird.org/api/data/v1/report-service',
  // PORTAL_API_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyZThlNmU5MjA4YjI0MjJmOWFlM2EzNjdiODVmNWQzNiJ9.gvpNN7zEl28ZVaxXWgFmCL6n65UJfXZikUWOKSE8vJ8',
  // PORTAL_API_AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4OTU4MzIyNzkyMTE0MWJiYWE0MjA4ZTBkMjE3YmU0ZiJ9.t2OPiAMuongqwSQfdJAsokgt2Eur5t7RchNZmWOwNTg",
  PORTAL_API_AUTH_TOKEN:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzVGRIUkFpTUFiRHN1SUhmQzFhYjduZXFxbjdyQjZrWSJ9.MotRsgyrPzt8O2jp8QZfWw0d9iIcZz-cfNYbpifx5vs",
  PORTAL_TELEMETRY_PACKET_SIZE: env.sunbird_telemetry_packet_size || 1000,
  PORTAL_ECHO_API_URL: env.sunbird_echo_api_url || 'https://devnulp.niua.org/api/echo/',
  PORTAL_AUTOCREATE_TRAMPOLINE_USER: env.sunbird_autocreate_trampoline_user || 'true',
  PORTAL_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_client_id || 'trampoline',
  PORTAL_TRAMPOLINE_SECRET: env.sunbird_trampoline_secret,
  ENABLE_PERMISSION_CHECK: 1 || 0,
  PORTAL_SESSION_STORE_TYPE: env.sunbird_session_store_type || 'in-memory',
  PORTAL_CDN_URL: env.sunbird_portal_cdn_url || '',
  CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
  LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
  DATASERVICE_URL: env.sunbird_dataservice_url || 'https://devnulp.niua.org/api/',
  KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
  KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
  CACHE_STORE: env.sunbird_cache_store || 'memory',
  CACHE_TTL: env.sunbird_cache_ttl || 1800,
  reportsListVersion: env.reportsListVersion || 'v2',
  ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
  BUILD_NUMBER: env.sunbird_build_number || packageObj.version + '.' + packageObj.buildHash,
  TELEMETRY_SERVICE_LOCAL_URL: env.sunbird_telemetry_service_local_url || 'http://telemetry-service:9001/',
  PORTAL_API_CACHE_TTL: env.sunbird_api_response_cache_ttl || '600',
  TENANT_CDN_URL: env.sunbird_tenant_cdn_url || '',
  CLOUD_STORAGE_URLS: env.sunbird_cloud_storage_urls,
  PORTAL_CASSANDRA_CONSISTENCY_LEVEL: env.sunbird_cassandra_consistency_level || 'one',
  PORTAL_CASSANDRA_REPLICATION_STRATEGY: env.sunbird_cassandra_replication_strategy || '{"class":"SimpleStrategy","replication_factor":1}',
  PORTAL_EXT_PLUGIN_URL: process.env.sunbird_ext_plugin_url || 'http://player_player:3000/plugin/',
  DEVICE_REGISTER_API: process.env.sunbird_device_register_api || 'https://devnulp.niua.org/v3/device/register/',
  DEVICE_PROFILE_API: process.env.sunbird_device_profile_api || 'https://devnulp.niua.org/api/v3/device/profile/',
  sunbird_instance_name: env.sunbird_instance || 'Sunbird',
  sunbird_theme: env.sunbird_theme || 'default',
  sunbird_default_language: env.sunbird_portal_default_language || 'en',
  sunbird_primary_bundle_language: env.sunbird_portal_primary_bundle_language || 'en',
  //learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
  content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content-service:5000',
  sunbird_explore_button_visibility: env.sunbird_explore_button_visibility || 'true',
  sunbird_help_link_visibility: env.sunbird_help_link_visibility || 'true',
  sunbird_extcont_whitelisted_domains: env.sunbird_extcont_whitelisted_domains || 'youtube.com,youtu.be',
  sunbird_portal_user_upload_ref_link: env.sunbird_portal_user_upload_ref_link || 'http://www.sunbird.org/features-documentation/register_user',
  GOOGLE_OAUTH_CONFIG: {
    clientId: env.sunbird_google_oauth_clientId || '671624305038-e8pbpmidst6lf0j5qplp6g6odan3lbf5.apps.googleusercontent.com' || '903729999899-7vcrph3vro36ot43j1od8u6he9jjend0.apps.googleusercontent.com',
    clientSecret: env.sunbird_google_oauth_clientSecret || 'mDO2MM68iW23f47ZFtvREld9' || 'BAEAYRv7voTByz5rOKkbIE3u'
  },
  KEYCLOAK_GOOGLE_CLIENT: {
    clientId: env.sunbird_google_keycloak_client_id || 'google-auth',
    secret: env.sunbird_google_keycloak_secret || '8486df4b-2ec0-4249-92d8-5f3a7064cd07'
  },
  learnathon_voting_table_user:'postgres',
  learnathon_voting_table_host: '127.0.0.1',
  learnathon_voting_table_database: 'postgres',
  Learnathon_voting_table_password: 'postgres',
  learnathon_voting_table_port: 4000,
  elite_system_db_username: env.elite_system_db_username ||"nulp",
  elite_system_db_host:env.elite_system_db_host || "localhost",
  elite_system_db_database:env.elite_system_db_database || "nulp",
  elite_system_db_password:env.elite_system_db_password || "nulp",
  elite_system_db_port:env.elite_system_db_port || 5433,

  // sunbird_google_captcha_site_key: env.sunbird_google_captcha_site_key || '6Ldcf4EUAAAAAMrKQSviNtEzMretoDgeAUxqJv7d',
  sunbird_azure_report_container_name: env.sunbird_azure_report_container_name || 'reports',
  sunbird_azure_account_name: env.sunbird_azure_account_name || 'sunbirddevprivate',
  sunbird_azure_account_key: env.sunbird_azure_account_key || 'nzng+3OKQQyuDkCVz+TqFVnLIjqCvZcL+Wiio9zXBG9nUXoJ4atnT+u8D7+/IDiqMy6eN72NXkHXgkgvLx6Qqw==',
  sunbird_portal_health_check_enabled: env.sunbird_health_check_enable || 'true',
  sunbird_learner_service_health_status: 'true',
  sunbird_google_captcha_site_key: '6Ldk3O8UAAAAAC2tm0qkPGbJC7YJVpVzMeIuhumb',
  google_captcha_private_key: '6Ldk3O8UAAAAADomyNFfGHh-bGf0_z6FzaHR4N35',
  sunbird_content_service_health_status: 'true',
  sunbird_portal_cassandra_db_health_status: 'true',
  sunbird_portal_player_cdn_enabled: env.sunbird_portal_player_cdn_enabled,
  sunbird_processing_kafka_host: process.env.sunbird_processing_kafka_host,
  sunbird_sso_kafka_topic: process.env.sunbird_sso_kafka_topic,
  sunbird_portal_offline_tenant: env.sunbird_portal_offline_tenant || 'ap,tn',
  sunbird_portal_offline_supported_languages: env.sunbird_portal_offline_supported_languages,
  sunbird_portal_offline_app_release_date: env.sunbird_portal_offline_app_release_date,
  sunbird_portal_offline_app_version: env.sunbird_portal_offline_app_version,
  sunbird_portal_offline_app_download_url: env.sunbird_portal_offline_app_download_url || 'https://sunbird-ed.github.io/sunbird-style-guide/dist/#/test-page',
  sunbird_portal_cdn_blob_url: env.sunbird_portal_cdn_blob_url || '',
  sunbird_portal_log_level: env.sunbird_portal_log_level || 'debug',
  Sunbird_bot_configured: 'true',
  Sunbird_bot_service_URL: '/chatapi/bot',
  KEYCLOAK_GOOGLE_ANDROID_CLIENT: {
    clientId: env.sunbird_google_android_keycloak_client_id,
    secret: env.sunbird_google_android_keycloak_secret
  },
  KEYCLOAK_TRAMPOLINE_ANDROID_CLIENT: {
    clientId: env.sunbird_trampoline_android_keycloak_client_id,
    secret: env.sunbird_trampoline_android_keycloak_secret
  },
  KEYCLOAK_ANDROID_CLIENT: {
    clientId: env.sunbird_android_keycloak_client_id || 'android',
  },
  CONTENT_EDITORS_URL: {
    COLLECTION_EDITOR: env.sunbird_collectionEditorURL || '/thirdparty/editors/collection-editor/index.html',
    CONTENT_EDITOR: env.sunbird_contentEditorURL || '/thirdparty/editors/content-editor/index.html',
    GENERIC_EDITOR: env.sunbird_genericEditorURL || '/thirdparty/editors/generic-editor/index.html'
  },
  PHRASE_APP: {
    phrase_authToken: env.sunbird_phraseApp_token || '',
    phrase_project: env.phrase_project || 'DIKSHA Portal,Sunbird Creation',
    phrase_locale: env.phrase_locale || ['en-IN', 'bn-IN', 'hi-IN', 'kn-IN', 'mr-IN', 'ur-IN', 'te-IN', 'ta-IN'],
    phrase_fileformat: env.phrase_fileformat || 'json'
  },
  KEYCLOAK_TRAMPOLINE_DESKTOP_CLIENT: {
    clientId: env.sunbird_trampoline_desktop_keycloak_client_id,
    secret: env.sunbird_trampoline_desktop_keycloak_secret
  },
  KEYCLOAK_DESKTOP_CLIENT: {
    clientId: env.sunbird_desktop_keycloak_client_id || 'desktop',
  },
  KEYCLOAK_GOOGLE_DESKTOP_CLIENT: {
    clientId: env.sunbird_google_desktop_keycloak_client_id,
    secret: env.sunbird_google_desktop_keycloak_secret
  },
  sunbird_anonymous_device_register_api: env.sunbird_anonymous_device_register_api || 'https://devnulp.niua.org/api/api-manager/v2/consumer/portal_anonymous/credential/register',
sunbird_loggedin_device_register_api: env.sunbird_loggedin_device_register_api || 'https://devnulp.niua.org/api/api-manager/v2/consumer/portal_loggedin/credential/register',
sunbird_kong_refresh_token_api: env.sunbird_kong_refresh_token_api || 'https://devnulp.niua.org/auth/v1/refresh/token',

// Device register API for anonymous users
sunbird_anonymous_register_token: env.sunbird_anonymous_register_token || '',
// Device register API for logged in users
sunbird_loggedin_register_token: env.sunbird_loggedin_register_token || '',

// Fallback token for device register API for `anonymous` users
sunbird_anonymous_default_token: env.sunbird_anonymous_default_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzVGRIUkFpTUFiRHN1SUhmQzFhYjduZXFxbjdyQjZrWSJ9.MotRsgyrPzt8O2jp8QZfWw0d9iIcZz-cfNYbpifx5vs',
// Fallback token for device register API for `logged` users
sunbird_logged_default_token: env.sunbird_logged_default_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzVGRIUkFpTUFiRHN1SUhmQzFhYjduZXFxbjdyQjZrWSJ9.MotRsgyrPzt8O2jp8QZfWw0d9iIcZz-cfNYbpifx5vs'
}
devEnvVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

let preprodEnvVariables = {
    uci_service_base_url: env.uci_service_base_url || "http://uci-service:9999",
    ML_SERVICE_BASE_URL: env.ML_SERVICE_BASE_URL || "https://survey.preprod.ntp.net.in/staging",
    GOOGLE_OAUTH_CONFIG_IOS: {
      clientId: '' || env.sunbird_google_oauth_ios_clientId,
      clientSecret: ''||env.sunbird_google_oauth_ios_clientSecret
    },
    KEYCLOAK_GOOGLE_IOS_CLIENT: {
      clientId: env.sunbird_google_oauth_ios_clientId,
      secret: env.sunbird_trampoline_desktop_keycloak_secret
    },
    ML_SERVICE_BASE_URL: env.ML_SERVICE_BASE_URL || "https://survey.preprod.ntp.net.in/staging",
    ML_URL: {
      OBSERVATION_URL: ''
    },
    PORTAL_SESSION_SECRET_KEY: "sunbird,717b3357-b2b1-4e39-9090-1c712d1b8b64".split(','),
  
    sunbird_device_api: env.sunbird_device_api || 'https://nulp.niua.org/api/',
     sunbird_azure_resourceBundle_container_name: env.sunbird_azure_resourceBundle_container_name || 'label',
    LEARNER_URL: env.sunbird_learner_player_url || 'https://nulp.niua.org/api/',
    CONTENT_URL: env.sunbird_content_player_url || 'https://nulp.niua.org/api/',
    CONFIG_URL: env.sunbird_config_service_url || 'https://nulp.niua.org/api/config/',
    CONFIG_REFRESH_INTERVAL: env.config_refresh_interval || 10,
    sunbird_kid_public_key_base_path: env.sunbird_kid_public_key_base_path || '/keys/',
    // discussion forum
    discussion_forum_token: env.discussion_forum_token || 'a4838b88-6a04-4293-a504-245862cad404',
    //discussions_middleware: env.discussions_middleware || 'http://disussionsmw-service:3002/discussion',
    discussions_middleware: env.discussions_middleware || 'http://localhost:3002',
  
    CONFIG_SERVICE_ENABLED: env.config_service_enabled || false,
    CONTENT_PROXY_URL: 'https://nulp.niua.org',
    // CONTENT_PROXY_URL: env.sunbird_content_proxy_url || 'https://nulp.niua.org/',
    PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
    PORTAL_AUTH_SERVER_URL: env.sunbird_portal_auth_server_url || 'https://nulp.niua.org/auth',
    PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
    APPID: process.env.sunbird_environment + '.' + process.env.sunbird_instance + '.portal',
    DEFAULT_CHANNEL: env.sunbird_default_channel || 'tn',
    sunbird_super_admin_slug: env.sunbird_super_admin_slug || 'sunbird',
    EKSTEP_ENV: env.ekstep_env || 'qa',
    PORTAL_PORT: env.sunbird_port || 3000,
    learner_Service_Local_BaseUrl: 'http://11.2.6.6/',
    REPORT_SERVICE_URL: env.sunbird_report_service_url || 'https://staging.open-sunbird.org/api/data/v1/report-service',
    sunbird_data_product_service: env.sunbird_data_product_service || 'https://staging.ntp.net.in/',
  
    // REPORT_SERVICE_URL: "http://localhost:3030" || env.sunbird_report_service_url || 'https://staging.open-sunbird.org/api/data/v1/report-service',
    // PORTAL_API_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyZThlNmU5MjA4YjI0MjJmOWFlM2EzNjdiODVmNWQzNiJ9.gvpNN7zEl28ZVaxXWgFmCL6n65UJfXZikUWOKSE8vJ8',
    // PORTAL_API_AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4OTU4MzIyNzkyMTE0MWJiYWE0MjA4ZTBkMjE3YmU0ZiJ9.t2OPiAMuongqwSQfdJAsokgt2Eur5t7RchNZmWOwNTg",
    PORTAL_API_AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o",
    PORTAL_TELEMETRY_PACKET_SIZE: env.sunbird_telemetry_packet_size || 1000,
    PORTAL_ECHO_API_URL: env.sunbird_echo_api_url || 'https://nulp.niua.org/api/echo/',
    PORTAL_AUTOCREATE_TRAMPOLINE_USER: env.sunbird_autocreate_trampoline_user || 'true',
    PORTAL_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_client_id || 'trampoline',
    PORTAL_TRAMPOLINE_SECRET: env.sunbird_trampoline_secret,
    ENABLE_PERMISSION_CHECK: 1 || 0,
    PORTAL_SESSION_STORE_TYPE: env.sunbird_session_store_type || 'in-memory',
    PORTAL_CDN_URL: env.sunbird_portal_cdn_url || '',
    CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
    LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
    DATASERVICE_URL: env.sunbird_dataservice_url || 'https://nulp.niua.org/api/',
    KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
    KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
    CACHE_STORE: env.sunbird_cache_store || 'memory',
    CACHE_TTL: env.sunbird_cache_ttl || 1800,
    reportsListVersion: env.reportsListVersion || 'v2',
    ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
    BUILD_NUMBER: env.sunbird_build_number || packageObj.version + '.' + packageObj.buildHash,
    TELEMETRY_SERVICE_LOCAL_URL: env.sunbird_telemetry_service_local_url || 'http://telemetry-service:9001/',
    PORTAL_API_CACHE_TTL: env.sunbird_api_response_cache_ttl || '600',
    TENANT_CDN_URL: env.sunbird_tenant_cdn_url || '',
    CLOUD_STORAGE_URLS: env.sunbird_cloud_storage_urls,
    PORTAL_CASSANDRA_CONSISTENCY_LEVEL: env.sunbird_cassandra_consistency_level || 'one',
    PORTAL_CASSANDRA_REPLICATION_STRATEGY: env.sunbird_cassandra_replication_strategy || '{"class":"SimpleStrategy","replication_factor":1}',
    PORTAL_EXT_PLUGIN_URL: process.env.sunbird_ext_plugin_url || 'http://player_player:3000/plugin/',
    DEVICE_REGISTER_API: process.env.sunbird_device_register_api || 'https://nulp.niua.org/v3/device/register/',
    DEVICE_PROFILE_API: process.env.sunbird_device_profile_api || 'https://nulp.niua.org/api/v3/device/profile/',
    sunbird_instance_name: env.sunbird_instance || 'Sunbird',
    sunbird_theme: env.sunbird_theme || 'default',
    sunbird_default_language: env.sunbird_portal_default_language || 'en',
    sunbird_primary_bundle_language: env.sunbird_portal_primary_bundle_language || 'en',
    //learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
    content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content-service:5000',
    sunbird_explore_button_visibility: env.sunbird_explore_button_visibility || 'true',
    sunbird_help_link_visibility: env.sunbird_help_link_visibility || 'true',
    sunbird_extcont_whitelisted_domains: env.sunbird_extcont_whitelisted_domains || 'youtube.com,youtu.be',
    sunbird_portal_user_upload_ref_link: env.sunbird_portal_user_upload_ref_link || 'http://www.sunbird.org/features-documentation/register_user',
    GOOGLE_OAUTH_CONFIG: {
      clientId: env.sunbird_google_oauth_clientId || '671624305038-e8pbpmidst6lf0j5qplp6g6odan3lbf5.apps.googleusercontent.com' || '903729999899-7vcrph3vro36ot43j1od8u6he9jjend0.apps.googleusercontent.com',
      clientSecret: env.sunbird_google_oauth_clientSecret || 'mDO2MM68iW23f47ZFtvREld9' || 'BAEAYRv7voTByz5rOKkbIE3u'
    },
    KEYCLOAK_GOOGLE_CLIENT: {
      clientId: env.sunbird_google_keycloak_client_id || 'google-auth',
      secret: env.sunbird_google_keycloak_secret || '8486df4b-2ec0-4249-92d8-5f3a7064cd07'
    },
    learnathon_voting_table_user:'postgres',
    learnathon_voting_table_host: '127.0.0.1',
    learnathon_voting_table_database: 'postgres',
    Learnathon_voting_table_password: 'postgres',
    learnathon_voting_table_port: 4000,
    // sunbird_google_captcha_site_key: env.sunbird_google_captcha_site_key || '6Ldcf4EUAAAAAMrKQSviNtEzMretoDgeAUxqJv7d',
    sunbird_azure_report_container_name: env.sunbird_azure_report_container_name || 'reports',
    sunbird_azure_account_name: env.sunbird_azure_account_name || 'sunbirddevprivate',
    sunbird_azure_account_key: env.sunbird_azure_account_key || 'nzng+3OKQQyuDkCVz+TqFVnLIjqCvZcL+Wiio9zXBG9nUXoJ4atnT+u8D7+/IDiqMy6eN72NXkHXgkgvLx6Qqw==',
    sunbird_portal_health_check_enabled: env.sunbird_health_check_enable || 'true',
    sunbird_learner_service_health_status: 'true',
    sunbird_google_captcha_site_key: '6Ldk3O8UAAAAAC2tm0qkPGbJC7YJVpVzMeIuhumb',
    google_captcha_private_key: '6Ldk3O8UAAAAADomyNFfGHh-bGf0_z6FzaHR4N35',
    sunbird_content_service_health_status: 'true',
    sunbird_portal_cassandra_db_health_status: 'true',
    sunbird_portal_player_cdn_enabled: env.sunbird_portal_player_cdn_enabled,
    sunbird_processing_kafka_host: process.env.sunbird_processing_kafka_host,
    sunbird_sso_kafka_topic: process.env.sunbird_sso_kafka_topic,
    sunbird_portal_offline_tenant: env.sunbird_portal_offline_tenant || 'ap,tn',
    sunbird_portal_offline_supported_languages: env.sunbird_portal_offline_supported_languages,
    sunbird_portal_offline_app_release_date: env.sunbird_portal_offline_app_release_date,
    sunbird_portal_offline_app_version: env.sunbird_portal_offline_app_version,
    sunbird_portal_offline_app_download_url: env.sunbird_portal_offline_app_download_url || 'https://sunbird-ed.github.io/sunbird-style-guide/dist/#/test-page',
    sunbird_portal_cdn_blob_url: env.sunbird_portal_cdn_blob_url || '',
    sunbird_portal_log_level: env.sunbird_portal_log_level || 'debug',
    Sunbird_bot_configured: 'true',
    Sunbird_bot_service_URL: '/chatapi/bot',
    KEYCLOAK_GOOGLE_ANDROID_CLIENT: {
      clientId: env.sunbird_google_android_keycloak_client_id,
      secret: env.sunbird_google_android_keycloak_secret
    },
    KEYCLOAK_TRAMPOLINE_ANDROID_CLIENT: {
      clientId: env.sunbird_trampoline_android_keycloak_client_id,
      secret: env.sunbird_trampoline_android_keycloak_secret
    },
    KEYCLOAK_ANDROID_CLIENT: {
      clientId: env.sunbird_android_keycloak_client_id || 'android',
    },
    CONTENT_EDITORS_URL: {
      COLLECTION_EDITOR: env.sunbird_collectionEditorURL || '/thirdparty/editors/collection-editor/index.html',
      CONTENT_EDITOR: env.sunbird_contentEditorURL || '/thirdparty/editors/content-editor/index.html',
      GENERIC_EDITOR: env.sunbird_genericEditorURL || '/thirdparty/editors/generic-editor/index.html'
    },
    PHRASE_APP: {
      phrase_authToken: env.sunbird_phraseApp_token || '',
      phrase_project: env.phrase_project || 'DIKSHA Portal,Sunbird Creation',
      phrase_locale: env.phrase_locale || ['en-IN', 'bn-IN', 'hi-IN', 'kn-IN', 'mr-IN', 'ur-IN', 'te-IN', 'ta-IN'],
      phrase_fileformat: env.phrase_fileformat || 'json'
    },
    KEYCLOAK_TRAMPOLINE_DESKTOP_CLIENT: {
      clientId: env.sunbird_trampoline_desktop_keycloak_client_id,
      secret: env.sunbird_trampoline_desktop_keycloak_secret
    },
    KEYCLOAK_DESKTOP_CLIENT: {
      clientId: env.sunbird_desktop_keycloak_client_id || 'desktop',
    },
    KEYCLOAK_GOOGLE_DESKTOP_CLIENT: {
      clientId: env.sunbird_google_desktop_keycloak_client_id,
      secret: env.sunbird_google_desktop_keycloak_secret
    },
    sunbird_anonymous_device_register_api: env.sunbird_anonymous_device_register_api || 'https://nulp.niua.org/api/api-manager/v2/consumer/portal_anonymous/credential/register',
  sunbird_loggedin_device_register_api: env.sunbird_loggedin_device_register_api || 'https://nulp.niua.org/api/api-manager/v2/consumer/portal_loggedin/credential/register',
  sunbird_kong_refresh_token_api: env.sunbird_kong_refresh_token_api || 'https://nulp.niua.org/auth/v1/refresh/token',
  
  // Device register API for anonymous users
  sunbird_anonymous_register_token: env.sunbird_anonymous_register_token || '',
  // Device register API for logged in users
  sunbird_loggedin_register_token: env.sunbird_loggedin_register_token || '',
  
  // Fallback token for device register API for `anonymous` users
  sunbird_anonymous_default_token: env.sunbird_anonymous_default_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o',
  // Fallback token for device register API for `logged` users
  sunbird_logged_default_token: env.sunbird_logged_default_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o'
}

preprodEnvVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

let newStagingEnvVariables = {
  GOOGLE_OAUTH_CONFIG_IOS: {
    clientId: '' || env.sunbird_google_oauth_ios_clientId,
    clientSecret: ''||env.sunbird_google_oauth_ios_clientSecret
  },
  KEYCLOAK_GOOGLE_IOS_CLIENT: {
    clientId: env.sunbird_google_oauth_ios_clientId,
    secret: env.sunbird_trampoline_desktop_keycloak_secret
  },
  ML_SERVICE_BASE_URL: env.ML_SERVICE_BASE_URL || "https://devnulp.niua.org/staging",
  ML_URL: {
    OBSERVATION_URL: ''
  },
  KEYCLOAK_GOOGLE_DESKTOP_CLIENT: {
    clientId: env.sunbird_google_desktop_keycloak_client_id,
    secret: env.sunbird_google_desktop_keycloak_secret
  },
  sunbird_device_api: env.sunbird_device_api || 'https://devnulp.niua.org/api/',
  PORTAL_SESSION_SECRET_KEY: "sunbird,717b3357-b2b1-4e39-9090-1c712d1b8b64".split(','),

  LEARNER_URL: env.sunbird_learner_player_url || 'https://devnulp.niua.org/api/',
  CONTENT_URL: env.sunbird_content_player_url || 'https://devnulp.niua.org/api/',
  CONFIG_URL: env.sunbird_config_service_url || 'https://devnulp.niua.org/api/config/',
  sunbird_super_admin_slug: env.sunbird_super_admin_slug || 'tn',
  CONFIG_REFRESH_INTERVAL: env.config_refresh_interval || 10,
  CONFIG_SERVICE_ENABLED: env.config_service_enabled || false,
  CONTENT_PROXY_URL: env.sunbird_content_proxy_url || 'https://devnulp.niua.org',
  PORTAL_REALM: env.sunbird_portal_realm || 'sunbird',
  PORTAL_AUTH_SERVER_URL: env.sunbird_portal_auth_server_url || 'https://devnulp.niua.org/auth',
  PORTAL_AUTH_SERVER_CLIENT: env.sunbird_portal_auth_server_client || 'portal',
  APPID: process.env.sunbird_environment + '.' + process.env.sunbird_instance + '.portal',
  DEFAULT_CHANNEL: env.sunbird_default_channel || 'tn',
  discussion_forum_token: env.discussion_forum_token || 'a4838b88-6a04-4293-a504-245862cad404',
  //discussions_middleware: env.discussions_middleware || 'http://disussionsmw-service:3002/discussion',
  discussions_middleware: env.discussions_middleware || 'http://localhost:3002',
  EKSTEP_ENV: env.ekstep_env || 'qa',
  PORTAL_PORT: env.sunbird_port || 3000,
  learner_Service_Local_BaseUrl: 'http://11.2.6.6/',
  REPORT_SERVICE_URL: 'https://devnulp.niua.org/api/data/v1/report-service',
  // PORTAL_API_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1S0xKdzBHRUd0M2VEMmlKNjJ1M05tRG1QY3Z6b0trWSJ9.6Av5aPfb_m22sCbbXdUKW3dQc8cRAt3tiIcCyGHjCzg',
  // PORTAL_API_AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJKa21PZDJGMzdmak1Vb3ZsdnBZclRCN3ZwTHlTV2dwWiJ9.Te7nCwnpPx5mx0P7cnveXtErMMSuarqALdiS1PFanW0',
  PORTAL_API_AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o",
  PORTAL_TELEMETRY_PACKET_SIZE: env.sunbird_telemetry_packet_size || 1000,
  PORTAL_ECHO_API_URL: env.sunbird_echo_api_url || 'https://devnulp.niua.org/api/echo/',
  PORTAL_AUTOCREATE_TRAMPOLINE_USER: env.sunbird_autocreate_trampoline_user || 'true',
  PORTAL_TRAMPOLINE_CLIENT_ID: env.sunbird_trampoline_client_id || 'trampoline',
  PORTAL_TRAMPOLINE_SECRET: env.sunbird_trampoline_secret,
  ENABLE_PERMISSION_CHECK: 1 || 0,
  PORTAL_SESSION_STORE_TYPE: env.sunbird_session_store_type || 'in-memory',
  PORTAL_CDN_URL: env.sunbird_portal_cdn_url || '',
  CONTENT_SERVICE_UPSTREAM_URL: env.sunbird_content_service_upstream_url || 'http://localhost:5000/',
  LEARNER_SERVICE_UPSTREAM_URL: env.sunbird_learner_service_upstream_url || 'http://localhost:9000/',
  DATASERVICE_URL: env.sunbird_dataservice_url || 'https://devnulp.niua.org/api/',
  KEY_CLOAK_PUBLIC: env.sunbird_keycloak_public || 'true',
  KEY_CLOAK_REALM: env.sunbird_keycloak_realm || 'sunbird',
  CACHE_STORE: env.sunbird_cache_store || 'memory',
  CACHE_TTL: env.sunbird_cache_ttl || 1800,
  ANDROID_APP_URL: env.sunbird_android_app_url || 'http://www.sunbird.org',
  BUILD_NUMBER: env.sunbird_build_number || packageObj.version + '.' + packageObj.buildHash,
  TELEMETRY_SERVICE_LOCAL_URL: 'https://devnulp.niua.org' || 'http://telemetry-service:9001/',
  PORTAL_API_CACHE_TTL: env.sunbird_api_response_cache_ttl || '600',
  TENANT_CDN_URL: env.sunbird_tenant_cdn_url || '',
  CLOUD_STORAGE_URLS: env.sunbird_cloud_storage_urls,
  PORTAL_CASSANDRA_CONSISTENCY_LEVEL: env.sunbird_cassandra_consistency_level || 'one',
  PORTAL_CASSANDRA_REPLICATION_STRATEGY: '{"class":"SimpleStrategy","replication_factor":1}',
  PORTAL_EXT_PLUGIN_URL: process.env.sunbird_ext_plugin_url || 'http://player_player:3000/plugin/',
  // DEVICE_REGISTER_API: process.env.sunbird_device_register_api || 'https://api.open-sunbird.org/v3/device/register/',
  DEVICE_REGISTER_API: process.env.sunbird_device_register_api || 'https://devnulp.niua.org/v3/device/register/',
  DEVICE_PROFILE_API: process.env.sunbird_device_profile_api || 'https://devnulp.niua.org/api/v3/device/profile/',
  sunbird_instance_name: env.sunbird_instance || 'Sunbird',
  sunbird_theme: env.sunbird_theme || 'default',
  sunbird_default_language: env.sunbird_portal_default_language || 'en',
  sunbird_primary_bundle_language: env.sunbird_portal_primary_bundle_language || 'en',
  //learner_Service_Local_BaseUrl: env.sunbird_learner_service_local_base_url || 'http://learner-service:9000',
  content_Service_Local_BaseUrl: env.sunbird_content_service_local_base_url || 'http://content-service:5000',
  sunbird_explore_button_visibility: env.sunbird_explore_button_visibility || 'true',
  sunbird_help_link_visibility: env.sunbird_help_link_visibility || 'true',
  sunbird_extcont_whitelisted_domains: env.sunbird_extcont_whitelisted_domains || 'youtube.com,youtu.be',
  sunbird_portal_user_upload_ref_link: env.sunbird_portal_user_upload_ref_link || 'http://www.sunbird.org/features-documentation/register_user',
  GOOGLE_OAUTH_CONFIG: {
    clientId: env.sunbird_google_oauth_clientId || '671624305038-e8pbpmidst6lf0j5qplp6g6odan3lbf5.apps.googleusercontent.com' || '903729999899-7vcrph3vro36ot43j1od8u6he9jjend0.apps.googleusercontent.com',
    clientSecret: env.sunbird_google_oauth_clientSecret || 'mDO2MM68iW23f47ZFtvREld9' || 'BAEAYRv7voTByz5rOKkbIE3u'
  },
  PHRASE_APP: {
    phrase_authToken: env.sunbird_phraseApp_token || '',
    phrase_project: env.phrase_project || 'DIKSHA Portal,Sunbird Creation',
    phrase_locale: env.phrase_locale || ['en-IN', 'bn-IN', 'hi-IN', 'kn-IN', 'mr-IN', 'ur-IN', 'te-IN', 'ta-IN'],
    phrase_fileformat: env.phrase_fileformat || 'json'
  },
  KEYCLOAK_GOOGLE_CLIENT: {
    clientId: env.sunbird_google_keycloak_client_id || 'google-auth',
    secret: env.sunbird_google_keycloak_secret || '8486df4b-2ec0-4249-92d8-5f3a7064cd07'
  },
  // sunbird_google_captcha_site_key: env.sunbird_google_captcha_site_key || '6Ldcf4EUAAAAAMrKQSviNtEzMretoDgeAUxqJv7d',
  // sunbird_azure_report_container_name: env.sunbird_azure_report_container_name || 'reports',
  // sunbird_azure_account_name: env.sunbird_azure_account_name || 'sunbirddev',
  // sunbird_azure_account_key: env.sunbird_azure_account_key || 'hVZeCECRUwsIZEL2h+GqF3bRo5Iz365G+zhrOZlYYYXBmrjuv4NyBv47xsmcvyQvAQPnnLG9r9iGil9TLgeyeA==',
    sunbird_azure_report_container_name: env.sunbird_azure_report_container_name || 'reports',
  sunbird_azure_account_name: env.sunbird_azure_account_name || 'sunbirddevprivate',
  sunbird_azure_account_key: env.sunbird_azure_account_key || 'nzng+3OKQQyuDkCVz+TqFVnLIjqCvZcL+Wiio9zXBG9nUXoJ4atnT+u8D7+/IDiqMy6eN72NXkHXgkgvLx6Qqw==',
  sunbird_portal_health_check_enabled: env.sunbird_health_check_enable || 'true',
  sunbird_learner_service_health_status: 'true',
  sunbird_google_captcha_site_key: '6Ldk3O8UAAAAAC2tm0qkPGbJC7YJVpVzMeIuhumb',
  google_captcha_private_key: '6Ldk3O8UAAAAADomyNFfGHh-bGf0_z6FzaHR4N35',
  sunbird_content_service_health_status: 'true',
  sunbird_portal_cassandra_db_health_status: 'true',
  sunbird_portal_player_cdn_enabled: env.sunbird_portal_player_cdn_enabled,
  sunbird_processing_kafka_host: process.env.sunbird_processing_kafka_host,
  sunbird_sso_kafka_topic: process.env.sunbird_sso_kafka_topic,
  sunbird_portal_offline_tenant: env.sunbird_portal_offline_tenant || 'ap,tn',
  sunbird_portal_offline_supported_languages: env.sunbird_portal_offline_supported_languages,
  sunbird_portal_offline_app_release_date: env.sunbird_portal_offline_app_release_date,
  sunbird_portal_offline_app_version: env.sunbird_portal_offline_app_version,
  sunbird_portal_offline_app_download_url: env.sunbird_portal_offline_app_download_url || 'https://sunbird-ed.github.io/sunbird-style-guide/dist/#/test-page',
  sunbird_portal_cdn_blob_url: env.sunbird_portal_cdn_blob_url || '',
  sunbird_portal_log_level: env.sunbird_portal_log_level || 'debug',
  sunbird_kid_public_key_base_path: env.sunbird_kid_public_key_base_path || '/keys/',
  Sunbird_bot_configured: 'true',
  Sunbird_bot_service_URL: '/chatapi/bot',
   // discussion forum
   discussion_forum_token: env.discussion_forum_token || 'a4838b88-6a04-4293-a504-245862cad404',
   discussions_middleware: env.discussions_middleware || 'http://disussionsmw-service:3002/discussion',
  KEYCLOAK_GOOGLE_ANDROID_CLIENT: {
    clientId: env.sunbird_google_android_keycloak_client_id,
    secret: env.sunbird_google_android_keycloak_secret
  },
  KEYCLOAK_TRAMPOLINE_ANDROID_CLIENT: {
    clientId: env.sunbird_trampoline_android_keycloak_client_id,
    secret: env.sunbird_trampoline_android_keycloak_secret
  },
  KEYCLOAK_ANDROID_CLIENT: {
    clientId: env.sunbird_android_keycloak_client_id || 'android',
  },
  KEYCLOAK_TRAMPOLINE_DESKTOP_CLIENT: {
    clientId: env.sunbird_trampoline_desktop_keycloak_client_id,
    secret: env.sunbird_trampoline_desktop_keycloak_secret
  },
  KEYCLOAK_DESKTOP_CLIENT: {
    clientId: env.sunbird_desktop_keycloak_client_id || 'desktop',
  },
  CONTENT_EDITORS_URL: {
    COLLECTION_EDITOR: env.sunbird_collectionEditorURL || '/thirdparty/editors/collection-editor/index.html',
    CONTENT_EDITOR: env.sunbird_contentEditorURL || '/thirdparty/editors/content-editor/index.html',
    GENERIC_EDITOR: env.sunbird_genericEditorURL || '/thirdparty/editors/generic-editor/index.html'
  },
  sunbird_azure_resourceBundle_container_name: env.sunbird_azure_resourceBundle_container_name || 'label',
  sunbird_data_product_service: env.sunbird_data_product_service || 'https://devnulp.niua.org/',
  GOOGLE_OAUTH_CONFIG_IOS: {
    clientId: '' || env.sunbird_google_oauth_ios_clientId,
    clientSecret: ''||env.sunbird_google_oauth_ios_clientSecret
  }

}
newStagingEnvVariables.PORTAL_CASSANDRA_URLS = (env.sunbird_cassandra_urls && env.sunbird_cassandra_urls !== '')
  ? env.sunbird_cassandra_urls.split(',') : ['localhost']

if (__envIn == 'dev') {
  // console.log("+++++++++++++", devEnvVariables);
  module.exports = devEnvVariables
} else if (__envIn == 'preprod') {
  module.exports = preprodEnvVariables
} else if (__envIn == 'newStaging') {
  module.exports = newStagingEnvVariables
}
