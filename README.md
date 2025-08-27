# DemoProject

A modern Next.js application with AWS CDK infrastructure as code, featuring a scalable, secure, and production-ready architecture.

## 🚀 Features

### Next.js Application
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for modern, responsive UI design
- **App Router** with the latest Next.js 15 features
- **Standalone Output** optimized for Docker containers
- **Health Check API** for infrastructure monitoring
- **Modern React 19** with server actions and typed routes

### AWS Infrastructure
- **Multi-tier Architecture** with proper security segmentation
- **ECS Fargate** for containerized application deployment
- **RDS PostgreSQL** with automated backups and encryption
- **ElastiCache Redis** for high-performance caching
- **Application Load Balancer** with health checks and auto-scaling
- **VPC with Security Groups** for network isolation
- **Secrets Manager** for secure credential management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                INTERNET                                    │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Application Load Balancer (ALB)                         │
│                              Port 80/443                                   │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Private Subnets (AZ1, AZ2)                              │
│                   - ECS Fargate Tasks (Next.js App)                       │
│                   - Auto-scaling (2-10 instances)                         │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Isolated Subnets (AZ1, AZ2)                              │
│                  - RDS PostgreSQL Database                                 │
│                  - ElastiCache Redis Cluster                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend & Backend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework

### Infrastructure
- **AWS CDK** - Infrastructure as Code
- **ECS Fargate** - Serverless container orchestration
- **RDS PostgreSQL 15.4** - Managed relational database
- **ElastiCache Redis 7** - Managed in-memory cache
- **Application Load Balancer** - Traffic distribution
- **VPC & Security Groups** - Network security

### DevOps & Monitoring
- **Docker** - Containerization
- **ECR** - Container registry
- **CloudWatch** - Monitoring and logging
- **Auto Scaling** - Dynamic resource management

## 📁 Project Structure

```
DemoProject/
├── src/                          # Next.js application source
│   ├── app/                     # App Router pages and components
│   │   ├── api/                 # API routes
│   │   │   └── health/          # Health check endpoint
│   │   ├── globals.css          # Global styles with Tailwind
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Home page component
│   └── ...
├── cdk/                         # AWS CDK infrastructure code
│   ├── bin/                     # CDK app entry point
│   ├── lib/                     # CDK constructs and stacks
│   ├── scripts/                 # Deployment scripts
│   ├── test/                    # CDK tests
│   └── README.md                # CDK documentation
├── public/                      # Static assets
├── Dockerfile                   # Container configuration
├── next.config.ts              # Next.js configuration
├── package.json                 # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **AWS CLI** configured with credentials
- **Docker** for containerization
- **AWS CDK CLI** (`npm install -g aws-cdk`)

### 1. Clone and Install
```bash
git clone <repository-url>
cd DemoProject
npm install
cd cdk && npm install
```

### 2. Configure AWS
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 3. Deploy Infrastructure
```bash
cd cdk

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy all infrastructure
cdk deploy --all
```

### 4. Build and Deploy Application
```bash
# Build the Next.js application
npm run build

# Build Docker image
docker build -t demoproject-app .

# Push to ECR (after infrastructure deployment)
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker tag demoproject-app:latest <ecr-repository-uri>:latest
docker push <ecr-repository-uri>:latest
```

### 5. Access Your Application
After deployment, you'll get the ALB DNS name from the CDK outputs. Access your application at:
```
http://<alb-dns-name>
```

## 🧪 Development

### Local Development
```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Infrastructure Development
```bash
cd cdk

# Watch for changes and compile
npm run watch

# Synthesize CloudFormation templates
cdk synth

# View differences
cdk diff
```

## 📚 Documentation

- **[CDK Infrastructure](./cdk/README.md)** - Complete infrastructure documentation
- **[Infrastructure Details](./cdk/INFRASTRUCTURE.md)** - Detailed architecture and deployment guide
- **[Deployment Scripts](./cdk/scripts/)** - Automated deployment scripts for Linux/Mac and Windows

## 🔧 Useful Commands

### Application
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Infrastructure
```bash
cd cdk
npm run build        # Build CDK project
cdk synth            # Generate CloudFormation templates
cdk deploy --all     # Deploy all stacks
cdk destroy --all    # Destroy all infrastructure
cdk list             # List all stacks
cdk diff             # Show changes
```

### Docker
```bash
docker build -t demoproject-app .     # Build image
docker run -p 3000:3000 demoproject-app  # Run locally
```

## 🔒 Security Features

- **VPC Isolation** - All resources run in private VPC
- **Security Groups** - Restrictive network access controls
- **Encryption** - Data encrypted at rest and in transit
- **IAM Roles** - Least privilege access for services
- **Secrets Management** - Secure credential storage
- **Health Checks** - Application and infrastructure monitoring

## 💰 Cost Optimization

- **Development Environment**: T3.micro instances, minimal storage
- **Production Ready**: Auto-scaling, multi-AZ, reserved instances
- **Cost Monitoring**: CloudWatch metrics and cost alerts
- **Resource Optimization**: Right-sizing recommendations

## 🚨 Production Considerations

1. **Multi-AZ Deployment** - Enable for high availability
2. **Backup Strategy** - Increase RDS backup retention
3. **Monitoring** - Set up CloudWatch alarms and notifications
4. **Security** - Enable deletion protection and restrict IAM permissions
5. **Compliance** - Ensure infrastructure meets compliance requirements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **AWS CDK Team** for infrastructure as code tools
- **Tailwind CSS Team** for the utility-first CSS framework
- **Open Source Community** for all the amazing tools and libraries

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and AWS CDK**
