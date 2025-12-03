# ✅ Domain Fix Checklist

## Status: Ready for DNS Update

### What's Done ✅

- [x] Identified the problem (deleted CloudFront distribution)
- [x] Created new CloudFront distribution: `d3hb958vtn5ryr.cloudfront.net`
- [x] Configured Amplify to use new distribution
- [x] Verified app works on default domain
- [x] Created monitoring and diagnostic tools

### What You Need to Do 📋

- [ ] **Step 1:** Go to GoDaddy DNS Management
- [ ] **Step 2:** Update root domain (@) CNAME to `d3hb958vtn5ryr.cloudfront.net`
- [ ] **Step 3:** Update www subdomain CNAME to `d3hb958vtn5ryr.cloudfront.net`
- [ ] **Step 4:** Save DNS changes
- [ ] **Step 5:** Wait 30-60 minutes
- [ ] **Step 6:** Verify https://class-cast.com works

### Quick Reference

**See exact changes needed:**
```bash
node show-dns-changes.js
```

**Check current status:**
```bash
node diagnose-domain.js
```

**Monitor progress:**
```bash
node monitor-domain-fix.js
```

### DNS Values

| Record | Type | Name | Old Value (DELETE) | New Value (USE) |
|--------|------|------|-------------------|-----------------|
| Root | CNAME | @ | dt7gqfihc5ffq.cloudfront.net | d3hb958vtn5ryr.cloudfront.net |
| WWW | CNAME | www | dt7gqfihc5ffq.cloudfront.net | d3hb958vtn5ryr.cloudfront.net |

### Working URL (Use Now)

While DNS propagates, your app is fully functional at:

**https://main.d166bugwfgjggz.amplifyapp.com**

### Expected Timeline

| Time | What Happens |
|------|--------------|
| 0 min | Update DNS in GoDaddy |
| 10 min | DNS starts propagating |
| 30 min | DNS fully propagated |
| 45 min | SSL certificate auto-provisioned |
| 60 min | https://class-cast.com works! |

### Verification Commands

After DNS update, check progress:

```bash
# Check DNS resolution
nslookup class-cast.com
# Should show: d3hb958vtn5ryr.cloudfront.net

# Check Amplify status
node diagnose-domain.js
# Should show: Status: AVAILABLE

# Test the site
curl -I https://class-cast.com
# Should return: HTTP/2 200
```

### Success Criteria

You'll know it's working when:

1. ✅ `nslookup class-cast.com` shows `d3hb958vtn5ryr.cloudfront.net`
2. ✅ `node diagnose-domain.js` shows `Status: AVAILABLE`
3. ✅ `https://class-cast.com` loads your app
4. ✅ SSL certificate is valid (no browser warnings)

### If Something Goes Wrong

1. Run diagnostics: `node diagnose-domain.js`
2. Check DNS: `nslookup class-cast.com`
3. Verify you updated BOTH records (@ and www)
4. Wait longer (DNS can take up to 48 hours, but usually 30-60 min)
5. Use default domain in meantime: `https://main.d166bugwfgjggz.amplifyapp.com`

---

**Ready?** Go update those DNS records! 🚀
