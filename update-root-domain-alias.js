#!/usr/bin/env node

const { Route53Client, ListHostedZonesCommand, ChangeResourceRecordSetsCommand, ListResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

const route53 = new Route53Client({ region: 'us-east-1' });

const DOMAIN_NAME = 'class-cast.com';
const NEW_CLOUDFRONT = 'd3b65zcgatti79.cloudfront.net';
const CLOUDFRONT_HOSTED_ZONE_ID = 'Z2FDTNDATAQYW2'; // Standard CloudFront hosted zone ID

async function updateRootDomain() {
  console.log('🔄 Updating Root Domain A Record (ALIAS)\n');
  console.log('='.repeat(70));
  
  // Find hosted zone
  const zones = await route53.send(new ListHostedZonesCommand({}));
  const zone = zones.HostedZones.find(z => z.Name === `${DOMAIN_NAME}.`);
  
  if (!zone) {
    throw new Error('Hosted zone not found');
  }
  
  console.log(`\n✅ Found hosted zone: ${zone.Id}\n`);
  
  // Get current root record
  const records = await route53.send(new ListResourceRecordSetsCommand({
    HostedZoneId: zone.Id
  }));
  
  const rootRecord = records.ResourceRecordSets.find(r => 
    r.Name === `${DOMAIN_NAME}.` && r.Type === 'A'
  );
  
  if (rootRecord) {
    console.log('📋 Current root domain A record:');
    if (rootRecord.AliasTarget) {
      console.log(`   Alias to: ${rootRecord.AliasTarget.DNSName}`);
    }
    console.log();
  }
  
  // Update to new CloudFront
  console.log(`🔄 Updating to: ${NEW_CLOUDFRONT}\n`);
  
  const changes = {
    Changes: [
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: `${DOMAIN_NAME}.`,
          Type: 'A',
          AliasTarget: {
            DNSName: NEW_CLOUDFRONT,
            HostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID,
            EvaluateTargetHealth: false
          }
        }
      }
    ]
  };
  
  const response = await route53.send(new ChangeResourceRecordSetsCommand({
    HostedZoneId: zone.Id,
    ChangeBatch: changes
  }));
  
  console.log('✅ Root domain updated successfully!');
  console.log(`   Change ID: ${response.ChangeInfo.Id}`);
  console.log(`   Status: ${response.ChangeInfo.Status}\n`);
  
  console.log('='.repeat(70));
  console.log('\n⏳ DNS propagation will take 5-15 minutes\n');
  console.log('🔍 Check status with: node diagnose-domain.js\n');
  console.log('='.repeat(70));
}

updateRootDomain().catch(console.error);
