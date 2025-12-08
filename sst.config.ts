/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'edeo-cms',
      removal: ['production'].includes(input?.stage) ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          // TODO create separate dev and prod aws accounts and ~/.aws/config profiles
          // profile: input.stage === "production" ? "edeo-production" : "edeo-dev",
          profile: 'edeop', // TEMP: Testing with fresh IAM user
        },
      },
    };
  },

  console: {
    autodeploy: {
      target(event) {
        if (event.type === 'branch' && event.branch === 'main' && event.action === 'pushed') {
          return { stage: 'production' };
        }
      },
    },
  },

  async run() {
    const isProduction = $app.stage === 'production';

    const vpc = new sst.aws.Vpc('backend-vpc2', {
      bastion: isProduction, // Disable bastion in staging to save costs
      az: isProduction
        ? ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'] // 3 AZs for high availability
        : ['ap-south-1a', 'ap-south-1b'], // 2 AZs for staging - saves ~$60-100/month on NAT
      nat: 'managed', // elastic ip. In front of the NAT gateway. (adjust route table in lambda)
    });

    // test vpc outbound ip address, set up request bin, setup lambda function which calls endpoint, tht endpoint, call the bin, bin logs the ip.

    const redis = new sst.aws.Redis('backend-redis', {
      vpc,
      engine: 'valkey'
    });

    const cluster = new sst.aws.Cluster('backend-cluster', { vpc });

    // CloudFront CDN
    const cdn = new sst.aws.Router("MediaCdn");

    const bucket = new sst.aws.Bucket("MediaBucket", {
      access: "cloudfront",

      transform: {
        policy: (args) => {
          args.policy = aws.iam.getPolicyDocumentOutput({
            version: "2012-10-17",
            statements: [
              {
                sid: "DenyInsecureTransport",
                effect: "Deny",
                principals: [{ type: "*", identifiers: ["*"] }],
                actions: ["s3:*"],
                resources: [
                  $interpolate`arn:aws:s3:::${args.bucket}`,
                  $interpolate`arn:aws:s3:::${args.bucket}/*`,
                ],
                conditions: [
                  {
                    test: "Bool",
                    variable: "aws:SecureTransport",
                    values: ["false"],
                  },
                ],
              },
              {
                sid: "AllowCloudFrontServicePrincipalReadOnly",
                effect: "Allow",
                principals: [
                  { type: "Service", identifiers: ["cloudfront.amazonaws.com"] },
                ],
                actions: ["s3:GetObject"],
                resources: [
                  $interpolate`arn:aws:s3:::${args.bucket}/*`,
                ],
                conditions: [
                  {
                    test: "StringEquals",
                    variable: "AWS:SourceArn",
                    values: [
                      $interpolate`arn:aws:cloudfront::${aws.getCallerIdentityOutput().accountId}:distribution/${cdn.distributionID}`,
                    ],
                  },
                ],
              },
            ],
          }).json;
        },
      },
    });

    cdn.routeBucket("/", bucket);

    // Define secrets (set via `sst secret set <name> <value>`)
    // Secret names match the environment variable names exactly
    const DATABASE_URL = new sst.Secret('DATABASE_URL'); // supabase (DIRECT DATABASE)
    const WIDGET_DATABASE_URL = new sst.Secret('WIDGET_DATABASE_URL'); // supabase (TRANSACTIONAL DATABASE)
    const OPENAI_API_KEY = new sst.Secret('OPENAI_API_KEY');
    const ELEVENLABS_API_KEY = new sst.Secret('ELEVENLABS_API_KEY');
    const HEYGEN_API_KEY = new sst.Secret('HEYGEN_API_KEY');
    const HEYGEN_WEBHOOK_SECRET = new sst.Secret('HEYGEN_WEBHOOK_SECRET');
    const SUBMAGIC_API_KEY = new sst.Secret('SUBMAGIC_API_KEY');
    const NEXT_PUBLIC_SUPABASE_ANON_KEY = new sst.Secret('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    const AGENTA_API_KEY = new sst.Secret('AGENTA_API_KEY');
    const RESEND_API_KEY = new sst.Secret('RESEND_API_KEY');

    // This secret will be used BOTH at runtime and as a Docker build arg
    const BACKEND_BASE_URL = new sst.Secret('BACKEND_BASE_URL'); // e.g. https://cms-staging.edtechinc.com

    const backendEnvironment = {
      // Server configuration
      PORT: '4000',
      NODE_ENV: 'production',

      // Using your secret for both server-side and client-visible URLs
      FRONTEND_URL: BACKEND_BASE_URL.value,
      NEXT_PUBLIC_API_URL: BACKEND_BASE_URL.value,

      NEXT_PUBLIC_SUPABASE_URL: 'https://owlkvcjzvvjooxpaoqps.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: NEXT_PUBLIC_SUPABASE_ANON_KEY.value,

      // Database and Redis
      DATABASE_URL: DATABASE_URL.value,
      REDIS_URL: $interpolate`rediss://${redis.host}:${redis.port}`,

      REDIS_USERNAME: redis.username,
      REDIS_PASSWORD: redis.password,

      // API Keys
      OPENAI_API_KEY: OPENAI_API_KEY.value,

      ELEVENLABS_API_KEY: ELEVENLABS_API_KEY.value,
      ELEVENLABS_DEFAULT_VOICE_ID: 'EXAVITQu4vr4xnSDxMaL',
      ELEVENLABS_INTERVIEWER_VOICE_ID: 'EXAVITQu4vr4xnSDxMaL',
      ELEVENLABS_GUEST_VOICE_ID: 'ErXwobaYiN019PkySvjV',

      HEYGEN_API_KEY: HEYGEN_API_KEY.value,
      HEYGEN_DEFAULT_AVATAR_ID: '2243812587de464d9acbd9b54ea6bab6',
      HEYGEN_DEFAULT_TALKING_PHOTO_ID: '2243812587de464d9acbd9b54ea6bab6',
      HEYGEN_WEBHOOK_SECRET: HEYGEN_WEBHOOK_SECRET.value,
      HEYGEN_DEFAULT_CHARACTER_TYPE: 'talking_photo',
      HEYGEN_DEFAULT_VOICE_ID: '4ecb08e33f7f4259bd544aaeae2fd946',

      SUBMAGIC_API_KEY: SUBMAGIC_API_KEY.value,
      SUBMAGIC_API_URL: 'https://api.submagic.co/v1',
      SUBMAGIC_WEBHOOK_URL: BACKEND_BASE_URL.value,

      // Agenta
      AGENTA_API_KEY: AGENTA_API_KEY.value,
      AGENTA_BASE_URL: 'https://cloud.agenta.ai',
      AGENTA_ENVIRONMENT: 'production',
      AGENTA_CACHE_TTL: '900000',

      // Posthog
      POSTHOG_API_KEY: 'phc_QSTrwU48tyZkBRCB4PVoZi6nc6Us5ZNXDVuGY9nYnjE',
      POSTHOG_API_URL: 'https://us.i.posthog.com',

      // Resend
      RESEND_API_KEY: RESEND_API_KEY.value,
      SUPPORT_EMAIL_FROM: 'notifications@edtechinc.com',
      SUPPORT_EMAIL_TO: 'matthew@edtechinc.com,ross@edtechinc.com',

      // AWS S3 Storage - using SST bucket
      AWS_S3_BUCKET_NAME: bucket.name,
      AWS_REGION: 'ap-south-1',
      CLOUDFRONT_BASE_URL: cdn.url
    };

    const cms = new sst.aws.Service("backend-service", {
      cluster,
      link: [redis, bucket, OPENAI_API_KEY, ELEVENLABS_API_KEY, HEYGEN_API_KEY, HEYGEN_WEBHOOK_SECRET, SUBMAGIC_API_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, AGENTA_API_KEY, RESEND_API_KEY],
      environment: backendEnvironment,
      loadBalancer: {
        domain: {
          name: "cms-staging.edtechinc.com",
          cert: "arn:aws:acm:ap-south-1:119330870795:certificate/c0ce68ac-1b2e-48dd-9247-467a792f5ee6",
          dns: sst.aws.dns(),
        },
        rules: [
          { listen: "443/https", forward: "4000/http" },
        ],
        health: {
          "4000/http": { path: "/api/health" },
        },
      },
      cpu: isProduction ? "1 vCPU" : "0.5 vCPU",
      memory: isProduction ? "2 GB" : "1 GB",
      storage: "21 GB",
      scaling: {
        min: 1,
        max: isProduction ? 4 : 2,
        cpuUtilization: 70,
        memoryUtilization: 80,
      },
      image: {
        context: ".",
        dockerfile: "./apps/backend/Dockerfile",
        args: {
          // NEXT_PUBLIC_* must be passed at build time for Next.js to inline them
          NEXT_PUBLIC_SUPABASE_URL: 'https://owlkvcjzvvjooxpaoqps.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: NEXT_PUBLIC_SUPABASE_ANON_KEY.value,
        },
      },
    });


    const worker = new sst.aws.Service('backend-worker', {
      cluster,
      link: [redis, bucket, OPENAI_API_KEY, ELEVENLABS_API_KEY, HEYGEN_API_KEY, HEYGEN_WEBHOOK_SECRET, SUBMAGIC_API_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, AGENTA_API_KEY, RESEND_API_KEY],
      environment: backendEnvironment,

      // AWS Transcribe permissions for audio/video transcription
      permissions: [
        {
          actions: [
            "transcribe:StartTranscriptionJob",
            "transcribe:GetTranscriptionJob",
            "transcribe:ListTranscriptionJobs",
            "transcribe:DeleteTranscriptionJob",
          ],
          resources: ["*"],
        },
      ],

      // Higher resources than backend (media processing needs)
      cpu: isProduction ? "2 vCPU" : "1 vCPU",
      memory: isProduction ? "4 GB" : "2 GB",
      storage: "21 GB",

      // Single worker instance (BullMQ handles concurrency internally)
      scaling: {
        min: 1,
        max: 1,
      },

      // Use apps/worker implementation
      image: {
        context: '.',
        dockerfile: './apps/worker/Dockerfile',
      },
    });

    const widget = new sst.aws.Nextjs('widget', {
      vpc,
      path: './apps/widget',
      link: [WIDGET_DATABASE_URL],
      environment: {
        DATABASE_URL: WIDGET_DATABASE_URL.value,
        NODE_ENV: 'production',
      },

      domain: {
        name: 'widget-staging.edtechinc.com',
        cert: 'arn:aws:acm:us-east-1:119330870795:certificate/46327be8-8629-449f-832f-b5b7ef4eacc0',
        dns: sst.aws.dns(),
      },
    });

    // ip tester
    // const outboundIpTester = new sst.aws.Function("outbound-ip-tester", {
    //   vpc, // IMPORTANT: this puts the Lambda in the same VPC & behind the NAT
    //   handler: "packages/tools/outbound-ip-tester.handler",
    //   environment: {
    //     BIN_URL: "https://b9d55262e0485463c481g1pwy5oyyyyyb.oast.pro",
    //   },
    // });

    return {
      VPCId: vpc.id,
      RedisHost: redis.host,
      RedisPort: redis.port,
      S3Bucket: bucket.name,
      CloudFrontURL: cdn.url,
      BackendURL: cms.url,
      WidgetURL: widget.url,
      WorkerStatus: "deployed",
      OutboundIPs: vpc.nodes.elasticIps.apply((eips) =>
        eips.map((eip) => eip.publicIp)
      ),
      // OutboundIpTesterFunction: outboundIpTester.arn
    };
  },
});
