# 🌐 DNS Update Instructions for class-cast.com

## ✅ Status: New CloudFront Distribution Created!

AWS Amplify has created a **NEW** CloudFront distribution to replace the deleted one.

**New CloudFront Domain:** `d3hb958vtn5ryr.cloudfront.net`

---

## 🚀 Automated Update (Recommended)

Since you're using Route 53, we can update DNS automatically:

```bash
node update-route53-dns.js
```

This will find and update all CNAME records pointing to the old CloudFront.

---

## 📋 Manual Update in Route 53 (Alternative)

Go to AWS Route 53 console for `class-cast.com` and update these records:

### Record 1: Root Domain (@)
- **Type:** CNAME
- **Name:** `@` (or leave blank for root)
- **Value:** `d3hb958vtn5ryr.cloudfront.net`
- **TTL:** 600 seconds (or 1 hour)

### Record 2: WWW Subdomain
- **Type:** CNAME  
- **Name:** `www`
- **Value:** `d3hb958vtn5ryr.cloudfront.net`
- **TTL:** 600 seconds (or 1 hour)

---

## ⚠️ Important Notes

1. **Route 53 Advantage**
   - Route 53 supports ALIAS records for root domains
   - This is better than CNAME for the root domain
   
2. **Automatic Updates**
   - The script will automatically update all records
   - No manual changes needed if you run the script

3. **DNS Propagation Time**
   - Changes take 5-60 minutes to propagate
   - You can check progress with: `nslookup class-cast.com`

4. **SSL Certificate**
   - AWS will automatically provision a new SSL certificate
   - This happens in the background (20-30 minutes)
   - No action needed from you

---

## 🧪 How to Verify It's Working

After updating DNS, wait 10-15 minutes, then test:

```bash
# Check DNS resolution
nslookup class-cast.com

# Should show: d3hb958vtn5ryr.cloudfront.net

# Test the site
curl -I https://class-cast.com
```

---

## 📊 Current Status

| Item | Status |
|------|--------|
| Amplify App | ✅ Working |
| Default Domain | ✅ https://main.d166bugwfgjggz.amplifyapp.com |
| New CloudFront | ✅ Created: d3hb958vtn5ryr.cloudfront.net |
| Custom Domain Config | ⚠️ FAILED (waiting for DNS update) |
| DNS Records | ❌ Still pointing to old CloudFront |
| SSL Certificate | ⏳ Will auto-provision after DNS update |

---

## 🚀 Timeline

1. **Now:** Update DNS records in GoDaddy (5 minutes)
2. **+10 min:** DNS starts propagating
3. **+30 min:** DNS fully propagated, SSL provisioning starts
4. **+60 min:** Everything should be working at https://class-cast.com

---

## 💡 In the Meantime

Your app is fully functional at the default Amplify domain:

**👉 https://main.d166bugwfgjggz.amplifyapp.com**

All features, performance optimizations, and functionality are working perfectly there!

---

## 🆘 If You Need Help

After updating DNS, run this to check status:

```bash
node diagnose-domain.js
```

Once DNS is updated, the status should change from `FAILED` to `PENDING_VERIFICATION` to `AVAILABLE`.
