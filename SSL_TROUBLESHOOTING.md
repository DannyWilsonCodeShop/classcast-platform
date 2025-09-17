# AWS Amplify SSL Configuration Troubleshooting

## Current Issue: SSL Configuration Stuck

Your AWS Amplify app is stuck during SSL configuration for the domain `myclasscast.com`. This is a common issue with GoDaddy domains.

## Step-by-Step Troubleshooting

### 1. Check Current DNS Configuration

**In GoDaddy DNS Management:**
1. Go to [GoDaddy DNS Management](https://dcc.godaddy.com/manage/your-domain/dns)
2. Look for these records that Amplify should have created:
   - `_amazonssl.myclasscast.com` (CNAME record)
   - `myclasscast.com` (CNAME or A record)

**Expected CNAME values from Amplify:**
- `_amazonssl.myclasscast.com` → `[random-string].acm-validations.aws.`
- `myclasscast.com` → `[your-amplify-app].amplifyapp.com`

### 2. Common GoDaddy Issues

**Problem 1: Missing CNAME Records**
- GoDaddy sometimes doesn't show all CNAME records
- Check if `_amazonssl` record exists
- If missing, add it manually

**Problem 2: Wrong Record Type**
- Make sure `myclasscast.com` is CNAME, not A record
- A records don't work with Amplify custom domains

**Problem 3: DNS Propagation**
- DNS changes can take 24-48 hours
- Use [What's My DNS](https://www.whatsmydns.net/) to check propagation

### 3. Fix Steps

#### Step 1: Verify Amplify Domain Configuration
1. Go to AWS Amplify Console
2. Select your app
3. Go to "Domain management"
4. Check the status of `myclasscast.com`
5. Look for any error messages

#### Step 2: Check DNS Records in GoDaddy
1. Login to GoDaddy
2. Go to "My Products" → "DNS"
3. Find `myclasscast.com`
4. Click "Manage DNS"
5. Look for these records:

```
Type: CNAME
Name: _amazonssl
Value: [something].acm-validations.aws.
TTL: 600

Type: CNAME  
Name: @
Value: [your-app-id].amplifyapp.com
TTL: 600
```

#### Step 3: If Records Are Missing
1. Delete the domain from Amplify
2. Wait 5 minutes
3. Re-add the domain
4. Copy the new CNAME records to GoDaddy

#### Step 4: If Records Exist But Still Stuck
1. Change TTL to 300 seconds (5 minutes)
2. Wait 30 minutes
3. Check propagation with [What's My DNS](https://www.whatsmydns.net/)
4. Retry SSL configuration in Amplify

### 4. Alternative: Use Route 53

If GoDaddy continues to cause issues:

1. **Transfer DNS to Route 53:**
   - Create hosted zone in Route 53
   - Update nameservers in GoDaddy
   - Let Amplify manage DNS automatically

2. **Benefits:**
   - Automatic SSL certificate management
   - Faster DNS propagation
   - Better integration with AWS services

### 5. Check Certificate Status

**In AWS Certificate Manager:**
1. Go to AWS Console → Certificate Manager
2. Look for certificate for `myclasscast.com`
3. Check status:
   - "Issued" = Good
   - "Pending validation" = DNS issue
   - "Failed" = Need to retry

### 6. Force Retry SSL Configuration

1. In Amplify Console → Domain management
2. Click on your domain
3. Click "Retry" or "Re-verify"
4. Wait 10-15 minutes

### 7. Common Error Messages

**"Domain verification failed"**
- DNS records not propagated yet
- Wrong CNAME values
- Missing `_amazonssl` record

**"SSL certificate pending"**
- Normal for first 24 hours
- Check DNS propagation
- Verify CNAME records

**"Domain not found"**
- DNS not propagated
- Wrong domain name
- Nameserver issues

## Quick Fix Commands

### Check DNS Propagation
```bash
# Check if CNAME records are propagated
nslookup _amazonssl.myclasscast.com
nslookup myclasscast.com
```

### Test Domain Resolution
```bash
# Test if domain resolves to Amplify
curl -I https://myclasscast.com


## Next Steps

1. **First**: Check DNS records in GoDaddy
2. **Second**: Verify CNAME values match Amplify
3. **Third**: Wait for DNS propagation (up to 48 hours)
4. **Fourth**: Retry SSL configuration in Amplify
5. **Last Resort**: Consider moving DNS to Route 53

## Support Resources

- [AWS Amplify Custom Domains](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [GoDaddy DNS Management](https://www.godaddy.com/help/manage-dns-records-680)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

## Expected Timeline

- **DNS Propagation**: 1-48 hours
- **SSL Certificate**: 1-24 hours after DNS is correct
- **Total Time**: Up to 72 hours in worst case

**Most common fix**: Wait 24 hours for DNS propagation, then retry SSL configuration.
