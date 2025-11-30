const { CloudFrontClient, CreateDistributionCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { ACMClient, ListCertificatesCommand } = require('@aws-sdk/client-acm');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
const acm = new ACMClient({ region: 'us-east-1' });

// Configuration
const S3_BUCKET = 'classcast-videos-463470937777-us-east-1';
const CUSTOM_DOMAIN = 'cdn.class-cast.com'; // Use subdomain to avoid conflict with Amplify
const REGION = 'us-east-1';

async function setupCloudFront() {
  try {
    console.log('🚀 Setting up CloudFront distribution for ClassCast...\n');
    
    // Step 1: Check for SSL certificate
    console.log('📜 Checking for SSL certificate...');
    const certResponse = await acm.send(new ListCertificatesCommand({}));
    const cert = certResponse.CertificateSummaryList?.find(c => 
      c.DomainName === CUSTOM_DOMAIN || c.DomainName === `*.${CUSTOM_DOMAIN}`
    );
    
    if (!cert) {
      console.log('⚠️  No SSL certificate found for', CUSTOM_DOMAIN);
      console.log('💡 You can either:');
      console.log('   1. Create one in AWS Certificate Manager (ACM) in us-east-1');
      console.log('   2. Proceed without custom domain (use CloudFront default domain)');
      console.log('\nProceeding without custom domain...\n');
    } else {
      console.log('✅ Found SSL certificate:', cert.CertificateArn);
    }

    // Step 2: Create CloudFront distribution
    console.log('☁️  Creating CloudFront distribution...');
    
    const distributionConfig = {
      CallerReference: `classcast-${Date.now()}`,
      Comment: 'ClassCast CDN for videos and assets',
      Enabled: true,
      
      // Origins - S3 bucket
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: `S3-${S3_BUCKET}`,
            DomainName: `${S3_BUCKET}.s3.${REGION}.amazonaws.com`,
            S3OriginConfig: {
              OriginAccessIdentity: '' // We'll use public bucket access for now
            },
            ConnectionAttempts: 3,
            ConnectionTimeout: 10,
            OriginShield: {
              Enabled: false
            }
          }
        ]
      },
      
      // Default cache behavior
      DefaultCacheBehavior: {
        TargetOriginId: `S3-${S3_BUCKET}`,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        Compress: true,
        CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
        OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
        ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03', // CORS-with-preflight
        SmoothStreaming: false,
        FieldLevelEncryptionId: '',
        ForwardedValues: undefined, // Not used with cache policies
        MinTTL: undefined, // Not used with cache policies
        DefaultTTL: undefined, // Not used with cache policies
        MaxTTL: undefined, // Not used with cache policies
        TrustedSigners: {
          Enabled: false,
          Quantity: 0
        },
        TrustedKeyGroups: {
          Enabled: false,
          Quantity: 0
        },
        LambdaFunctionAssociations: {
          Quantity: 0
        },
        FunctionAssociations: {
          Quantity: 0
        }
      },
      
      // Custom error responses
      CustomErrorResponses: {
        Quantity: 2,
        Items: [
          {
            ErrorCode: 403,
            ResponsePagePath: '',
            ResponseCode: '',
            ErrorCachingMinTTL: 300
          },
          {
            ErrorCode: 404,
            ResponsePagePath: '',
            ResponseCode: '',
            ErrorCachingMinTTL: 300
          }
        ]
      },
      
      // Price class
      PriceClass: 'PriceClass_100', // Use only North America and Europe
      
      // Viewer certificate
      ViewerCertificate: cert ? {
        ACMCertificateArn: cert.CertificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2021',
        Certificate: cert.CertificateArn,
        CertificateSource: 'acm'
      } : {
        CloudFrontDefaultCertificate: true,
        MinimumProtocolVersion: 'TLSv1.2_2021'
      },
      
      // Aliases (custom domains)
      Aliases: cert ? {
        Quantity: 1,
        Items: [CUSTOM_DOMAIN]
      } : {
        Quantity: 0
      },
      
      // Restrictions
      Restrictions: {
        GeoRestriction: {
          RestrictionType: 'none',
          Quantity: 0
        }
      },
      
      // Logging
      Logging: {
        Enabled: false,
        IncludeCookies: false,
        Bucket: '',
        Prefix: ''
      },
      
      // HTTP version
      HttpVersion: 'http2and3',
      
      // IPv6
      IsIPV6Enabled: true
    };

    const createCommand = new CreateDistributionCommand({
      DistributionConfig: distributionConfig
    });

    const response = await cloudfront.send(createCommand);
    const distribution = response.Distribution;

    console.log('\n✅ CloudFront distribution created successfully!\n');
    console.log('📋 Distribution Details:');
    console.log('   ID:', distribution.Id);
    console.log('   Domain:', distribution.DomainName);
    console.log('   Status:', distribution.Status);
    console.log('   ARN:', distribution.ARN);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Add this to your .env.local file:');
    console.log(`   CLOUDFRONT_DOMAIN=${distribution.DomainName}`);
    
    if (cert) {
      console.log('\n2. Update your DNS records:');
      console.log(`   Type: CNAME`);
      console.log(`   Name: ${CUSTOM_DOMAIN}`);
      console.log(`   Value: ${distribution.DomainName}`);
      console.log(`   TTL: 300`);
    }
    
    console.log('\n3. Wait 10-15 minutes for the distribution to deploy globally');
    console.log('   Status will change from "InProgress" to "Deployed"');
    
    console.log('\n4. Test your CloudFront distribution:');
    console.log(`   https://${distribution.DomainName}/test-file.txt`);
    
    console.log('\n💡 To check distribution status, run:');
    console.log(`   node check-cloudfront-status.js ${distribution.Id}`);

    // Save distribution info
    const fs = require('fs');
    fs.writeFileSync('cloudfront-config.json', JSON.stringify({
      distributionId: distribution.Id,
      domainName: distribution.DomainName,
      customDomain: cert ? CUSTOM_DOMAIN : null,
      status: distribution.Status,
      createdAt: new Date().toISOString()
    }, null, 2));
    
    console.log('\n💾 Configuration saved to cloudfront-config.json');

  } catch (error) {
    console.error('❌ Error setting up CloudFront:', error);
    
    if (error.name === 'CNAMEAlreadyExists') {
      console.log('\n⚠️  The custom domain is already in use by another distribution.');
      console.log('   Please remove it from the other distribution first.');
    } else if (error.name === 'InvalidViewerCertificate') {
      console.log('\n⚠️  SSL certificate issue. Make sure:');
      console.log('   1. Certificate is in us-east-1 region');
      console.log('   2. Certificate is validated');
      console.log('   3. Certificate covers your domain');
    }
  }
}

setupCloudFront();
