#!/usr/bin/env node

/**
 * Update Route 53 DNS records for class-cast.com
 * 
 * This will update the CNAME records to point to the new CloudFront distribution
 */

const { Route53Client, ListHostedZonesCommand, ListResourceRecordSetsCommand, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

const route53 = new Route53Client({ region: 'us-east-1' });

const DOMAIN_NAME = 'class-cast.com';
const OLD_CLOUDFRONT = 'd3hb958vtn5ryr.cloudfront.net'; // Previous attempt
const NEW_CLOUDFRONT = 'd3b65zcgatti79.cloudfront.net'; // Latest CloudFront

async function findHostedZone() {
  console.log('🔍 Finding hosted zone for class-cast.com...\n');
  
  const response = await route53.send(new ListHostedZonesCommand({}));
  
  const zone = response.HostedZones.find(z => 
    z.Name === `${DOMAIN_NAME}.` || z.Name === DOMAIN_NAME
  );
  
  if (!zone) {
    throw new Error(`Hosted zone for ${DOMAIN_NAME} not found`);
  }
  
  console.log(`✅ Found hosted zone: ${zone.Id}`);
  console.log(`   Name: ${zone.Name}`);
  console.log();
  
  return zone.Id;
}

async function getCurrentRecords(hostedZoneId) {
  console.log('📋 Fetching current DNS records...\n');
  
  const response = await route53.send(new ListResourceRecordSetsCommand({
    HostedZoneId: hostedZoneId
  }));
  
  const cnameRecords = response.ResourceRecordSets.filter(r => 
    r.Type === 'CNAME' && 
    r.ResourceRecords?.some(rr => rr.Value.includes('cloudfront.net'))
  );
  
  console.log('Current CNAME records pointing to CloudFront:\n');
  cnameRecords.forEach(record => {
    const value = record.ResourceRecords[0].Value;
    const isOld = value.includes(OLD_CLOUDFRONT);
    console.log(`   ${isOld ? '❌' : '✅'} ${record.Name}`);
    console.log(`      → ${value}`);
    console.log();
  });
  
  return cnameRecords;
}

async function updateRecord(hostedZoneId, recordName, oldValue, newValue) {
  console.log(`🔄 Updating ${recordName}...`);
  
  const changes = {
    Changes: [
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: recordName,
          Type: 'CNAME',
          TTL: 300,
          ResourceRecords: [
            { Value: newValue }
          ]
        }
      }
    ]
  };
  
  try {
    const response = await route53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: changes
    }));
    
    console.log(`✅ Updated successfully`);
    console.log(`   Change ID: ${response.ChangeInfo.Id}`);
    console.log(`   Status: ${response.ChangeInfo.Status}`);
    console.log();
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Route 53 DNS Update for class-cast.com\n');
  console.log('='.repeat(70));
  console.log();
  
  try {
    // Find hosted zone
    const hostedZoneId = await findHostedZone();
    
    // Get current records
    const records = await getCurrentRecords(hostedZoneId);
    
    // Find records that need updating
    const recordsToUpdate = records.filter(r => 
      r.ResourceRecords?.some(rr => rr.Value.includes(OLD_CLOUDFRONT))
    );
    
    if (recordsToUpdate.length === 0) {
      console.log('✅ All records already point to the new CloudFront!\n');
      console.log('   No updates needed.\n');
      return;
    }
    
    console.log('='.repeat(70));
    console.log('\n📝 Records to update:\n');
    recordsToUpdate.forEach(r => {
      console.log(`   • ${r.Name}`);
    });
    console.log();
    console.log('='.repeat(70));
    console.log();
    
    // Update each record
    for (const record of recordsToUpdate) {
      const oldValue = record.ResourceRecords[0].Value;
      await updateRecord(hostedZoneId, record.Name, oldValue, NEW_CLOUDFRONT);
    }
    
    console.log('='.repeat(70));
    console.log('\n✅ DNS Update Complete!\n');
    console.log('⏱️  DNS propagation will take 5-15 minutes\n');
    console.log('🔍 Monitor progress with: node diagnose-domain.js\n');
    console.log('🌐 Your site will be live at: https://class-cast.com\n');
    console.log('='.repeat(70));
    console.log();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📖 Manual Update Instructions:\n');
    console.log('1. Go to AWS Route 53 Console');
    console.log('2. Select hosted zone: class-cast.com');
    console.log('3. Find CNAME records pointing to: dt7gqfihc5ffq.cloudfront.net');
    console.log('4. Update them to: d3hb958vtn5ryr.cloudfront.net');
    console.log();
    process.exit(1);
  }
}

main();
