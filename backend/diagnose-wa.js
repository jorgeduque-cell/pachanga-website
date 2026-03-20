const https = require('https');
require('dotenv').config();
const TOKEN = process.env.WHATSAPP_TOKEN;
const WABA_ID = '941161965157821';
const PHONE_ID = '1050662141458800';
const BUSINESS_ID = '2439113653183810';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v21.0${path}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TOKEN}` },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== DIAGNÓSTICO COMPLETO DE LA CUENTA ===\n');

  // 1. Estado de onboarding de marketing
  console.log('--- 1. WABA Status ---');
  const waba = await apiGet(`/${WABA_ID}?fields=id,name,currency,timezone_id,message_template_namespace,account_review_status,business_verification_status,marketing_messages_onboarding_status`);
  console.log(JSON.stringify(waba, null, 2));

  // 2. Owner business info
  console.log('\n--- 2. Owner Business Info ---');
  const owner = await apiGet(`/${WABA_ID}?fields=owner_business_info`);
  console.log(JSON.stringify(owner, null, 2));

  // 3. Phone number details
  console.log('\n--- 3. Phone Number Details ---');
  const phone = await apiGet(`/${PHONE_ID}?fields=verified_name,display_phone_number,quality_rating,platform_type,status,name_status,is_official_business_account,messaging_limit_tier,certificate,code_verification_status,eligibility_for_api_business_global_search,is_pin_enabled,register_modes`);
  console.log(JSON.stringify(phone, null, 2));

  // 4. Business portfolio status
  console.log('\n--- 4. Business Portfolio ---');
  const biz = await apiGet(`/${BUSINESS_ID}?fields=name,verification_status,is_disabled_for_integrity_reasons`);
  console.log(JSON.stringify(biz, null, 2));

  // 5. Check message status of last sent message
  console.log('\n--- 5. Verificando ultimo mensaje enviado ---');
  // Use the last wamid we got
  const lastWamid = 'wamid.HBgMNTczMTI0MTgzMDAyFQIAERgSOUY2NzUxODM3MTNENDhDRUJEAA==';
  const msgStatus = await apiGet(`/${lastWamid}`);
  console.log(JSON.stringify(msgStatus, null, 2));

  // 6. Analytics - check if messages are being counted
  console.log('\n--- 6. WABA Analytics ---');
  const analytics = await apiGet(`/${WABA_ID}?fields=analytics.start(1742428800).end(1742515200).granularity(DAY)`);
  console.log(JSON.stringify(analytics, null, 2));
}

main().catch(console.error);
