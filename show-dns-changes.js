#!/usr/bin/env node

console.log('\n🌐 DNS Changes Required in GoDaddy\n');
console.log('='.repeat(70));
console.log('\nGo to: GoDaddy → My Products → class-cast.com → DNS Management\n');
console.log('='.repeat(70));

console.log('\n📝 RECORD 1: Root Domain\n');
console.log('   Find the record with:');
console.log('   ❌ Name: @ (or blank)');
console.log('   ❌ Type: CNAME');
console.log('   ❌ Value: dt7gqfihc5ffq.cloudfront.net\n');
console.log('   Change it to:');
console.log('   ✅ Name: @ (or blank)');
console.log('   ✅ Type: CNAME');
console.log('   ✅ Value: d3hb958vtn5ryr.cloudfront.net');
console.log('   ✅ TTL: 600 (or default)\n');

console.log('='.repeat(70));

console.log('\n📝 RECORD 2: WWW Subdomain\n');
console.log('   Find the record with:');
console.log('   ❌ Name: www');
console.log('   ❌ Type: CNAME');
console.log('   ❌ Value: dt7gqfihc5ffq.cloudfront.net\n');
console.log('   Change it to:');
console.log('   ✅ Name: www');
console.log('   ✅ Type: CNAME');
console.log('   ✅ Value: d3hb958vtn5ryr.cloudfront.net');
console.log('   ✅ TTL: 600 (or default)\n');

console.log('='.repeat(70));

console.log('\n💡 Quick Copy-Paste:\n');
console.log('   OLD CloudFront (DELETE): dt7gqfihc5ffq.cloudfront.net');
console.log('   NEW CloudFront (USE):    d3hb958vtn5ryr.cloudfront.net\n');

console.log('='.repeat(70));

console.log('\n⏱️  After Saving:\n');
console.log('   1. Wait 10-15 minutes');
console.log('   2. Run: node diagnose-domain.js');
console.log('   3. Or monitor live: node monitor-domain-fix.js\n');

console.log('='.repeat(70));

console.log('\n🚀 Your app works NOW at:\n');
console.log('   https://main.d166bugwfgjggz.amplifyapp.com\n');
console.log('='.repeat(70));
console.log();
