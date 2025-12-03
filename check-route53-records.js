#!/usr/bin/env node

const { Route53Client, ListHostedZonesCommand, ListResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

const route53 = new Route53Client({ region: 'us-east-1' });

async function checkRecords() {
  console.log('🔍 Checking Route 53 Records for class-cast.com\n');
  console.log('='.repeat(70));
  
  // Find hosted zone
  const zones = await route53.send(new ListHostedZonesCommand({}));
  const zone = zones.HostedZones.find(z => z.Name === 'class-cast.com.' || z.Name === 'class-cast.com');
  
  if (!zone) {
    console.log('❌ Hosted zone not found');
    return;
  }
  
  console.log(`\n✅ Hosted Zone: ${zone.Id}`);
  console.log(`   Name: ${zone.Name}\n`);
  console.log('='.repeat(70));
  
  // Get all records
  const records = await route53.send(new ListResourceRecordSetsCommand({
    HostedZoneId: zone.Id
  }));
  
  console.log('\n📋 ALL DNS RECORDS:\n');
  
  records.ResourceRecordSets.forEach(record => {
    console.log(`Type: ${record.Type}`);
    console.log(`Name: ${record.Name}`);
    
    if (record.ResourceRecords) {
      record.ResourceRecords.forEach(rr => {
        console.log(`Value: ${rr.Value}`);
      });
    }
    
    if (record.AliasTarget) {
      console.log(`Alias: ${record.AliasTarget.DNSName}`);
      console.log(`Hosted Zone: ${record.AliasTarget.HostedZoneId}`);
    }
    
    console.log(`TTL: ${record.TTL || 'N/A'}`);
    console.log();
  });
  
  console.log('='.repeat(70));
  
  // Check what root domain points to
  const rootRecord = records.ResourceRecordSets.find(r => 
    r.Name === 'class-cast.com.' && (r.Type === 'A' || r.Type === 'CNAME' || r.Type === 'ALIAS')
  );
  
  console.log('\n🌐 ROOT DOMAIN (class-cast.com) STATUS:\n');
  if (rootRecord) {
    console.log(`   Type: ${rootRecord.Type}`);
    if (rootRecord.ResourceRecords) {
      console.log(`   Points to: ${rootRecord.ResourceRecords[0].Value}`);
    }
    if (rootRecord.AliasTarget) {
      console.log(`   Alias to: ${rootRecord.AliasTarget.DNSName}`);
    }
  } else {
    console.log('   ❌ No A, CNAME, or ALIAS record found for root domain');
  }
  
  console.log('\n='.repeat(70));
}

checkRecords().catch(console.error);
