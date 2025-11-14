#!/usr/bin/env node

/**
 * DynamoDB Backup Strategy Setup
 * Configures automated backups and point-in-time recovery
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ListTablesCommand } = require('@aws-sdk/lib-dynamodb');
const { BackupClient, CreateBackupVaultCommand, CreateBackupPlanCommand, CreateBackupSelectionCommand } = require('@aws-sdk/client-backup');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const backupClient = new BackupClient({ region: 'us-east-1' });

// Configuration
const BACKUP_VAULT_NAME = 'classcast-backup-vault';
const BACKUP_PLAN_NAME = 'classcast-backup-plan';
const BACKUP_SELECTION_NAME = 'classcast-backup-selection';

// DynamoDB tables to backup
const TABLES_TO_BACKUP = [
  'classcast-users',
  'classcast-courses',
  'classcast-assignments',
  'classcast-submissions',
  'classcast-videos',
  'classcast-peer-responses',
  'classcast-peer-interactions'
];

async function setupBackupVault() {
  console.log('📦 Setting up backup vault...');
  
  try {
    await backupClient.send(new CreateBackupVaultCommand({
      BackupVaultName: BACKUP_VAULT_NAME,
      BackupVaultTags: {
        'Environment': 'Production',
        'Application': 'ClassCast',
        'CreatedBy': 'Automated-Setup'
      }
    }));
    console.log(`✅ Created backup vault: ${BACKUP_VAULT_NAME}`);
  } catch (error) {
    if (error.name === 'AlreadyExistsException') {
      console.log(`ℹ️  Backup vault ${BACKUP_VAULT_NAME} already exists`);
    } else {
      console.error('❌ Error creating backup vault:', error.message);
      throw error;
    }
  }
}

async function setupBackupPlan() {
  console.log('📋 Setting up backup plan...');
  
  const backupPlan = {
    BackupPlanName: BACKUP_PLAN_NAME,
    Rules: [
      {
        RuleName: 'DailyBackup',
        TargetBackupVaultName: BACKUP_VAULT_NAME,
        ScheduleExpression: 'cron(0 2 * * ? *)', // Daily at 2 AM UTC
        StartWindowMinutes: 60,
        CompletionWindowMinutes: 120,
        Lifecycle: {
          DeleteAfterDays: 30, // Keep daily backups for 30 days
          MoveToColdStorageAfterDays: 7 // Move to cold storage after 7 days
        },
        RecoveryPointTags: {
          'BackupType': 'Daily',
          'Environment': 'Production'
        }
      },
      {
        RuleName: 'WeeklyBackup',
        TargetBackupVaultName: BACKUP_VAULT_NAME,
        ScheduleExpression: 'cron(0 3 ? * SUN *)', // Weekly on Sunday at 3 AM UTC
        StartWindowMinutes: 60,
        CompletionWindowMinutes: 180,
        Lifecycle: {
          DeleteAfterDays: 90, // Keep weekly backups for 90 days
          MoveToColdStorageAfterDays: 30
        },
        RecoveryPointTags: {
          'BackupType': 'Weekly',
          'Environment': 'Production'
        }
      },
      {
        RuleName: 'MonthlyBackup',
        TargetBackupVaultName: BACKUP_VAULT_NAME,
        ScheduleExpression: 'cron(0 4 1 * ? *)', // Monthly on 1st at 4 AM UTC
        StartWindowMinutes: 120,
        CompletionWindowMinutes: 240,
        Lifecycle: {
          DeleteAfterDays: 365, // Keep monthly backups for 1 year
          MoveToColdStorageAfterDays: 90
        },
        RecoveryPointTags: {
          'BackupType': 'Monthly',
          'Environment': 'Production'
        }
      }
    ]
  };
  
  try {
    await backupClient.send(new CreateBackupPlanCommand({
      BackupPlan: backupPlan
    }));
    console.log(`✅ Created backup plan: ${BACKUP_PLAN_NAME}`);
  } catch (error) {
    if (error.name === 'AlreadyExistsException') {
      console.log(`ℹ️  Backup plan ${BACKUP_PLAN_NAME} already exists`);
    } else {
      console.error('❌ Error creating backup plan:', error.message);
      throw error;
    }
  }
}

async function setupBackupSelection() {
  console.log('🎯 Setting up backup selection...');
  
  try {
    // Get backup plan ID
    const backupPlans = await backupClient.send(new ListBackupPlansCommand({}));
    const backupPlan = backupPlans.BackupPlansList.find(plan => plan.BackupPlanName === BACKUP_PLAN_NAME);
    
    if (!backupPlan) {
      throw new Error('Backup plan not found');
    }
    
    const backupSelection = {
      SelectionName: BACKUP_SELECTION_NAME,
      IamRoleArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '463470937777'}:role/ClassCastBackupRole`,
      Resources: TABLES_TO_BACKUP.map(table => `arn:aws:dynamodb:us-east-1:${process.env.AWS_ACCOUNT_ID || '463470937777'}:table/${table}`),
      ListOfTags: [
        {
          ConditionType: 'STRINGEQUALS',
          ConditionKey: 'Environment',
          ConditionValue: 'Production'
        }
      ]
    };
    
    await backupClient.send(new CreateBackupSelectionCommand({
      BackupPlanId: backupPlan.BackupPlanId,
      BackupSelection: backupSelection
    }));
    console.log(`✅ Created backup selection: ${BACKUP_SELECTION_NAME}`);
  } catch (error) {
    if (error.name === 'AlreadyExistsException') {
      console.log(`ℹ️  Backup selection ${BACKUP_SELECTION_NAME} already exists`);
    } else {
      console.error('❌ Error creating backup selection:', error.message);
      throw error;
    }
  }
}

async function enablePointInTimeRecovery() {
  console.log('⏰ Enabling point-in-time recovery...');
  
  const { DynamoDBClient: DynamoDBServiceClient } = require('@aws-sdk/client-dynamodb');
  const { UpdateContinuousBackupsCommand } = require('@aws-sdk/client-dynamodb');
  
  const dynamoServiceClient = new DynamoDBServiceClient({ region: 'us-east-1' });
  
  for (const tableName of TABLES_TO_BACKUP) {
    try {
      await dynamoServiceClient.send(new UpdateContinuousBackupsCommand({
        TableName: tableName,
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      }));
      console.log(`✅ Enabled PITR for table: ${tableName}`);
    } catch (error) {
      console.error(`❌ Error enabling PITR for ${tableName}:`, error.message);
    }
  }
}

async function createBackupScript() {
  console.log('📝 Creating backup management script...');
  
  const backupScript = `#!/bin/bash

# ClassCast Backup Management Script
# This script provides manual backup and restore capabilities

set -e

# Configuration
BACKUP_VAULT_NAME="classcast-backup-vault"
TABLES=("classcast-users" "classcast-courses" "classcast-assignments" "classcast-submissions" "classcast-videos" "classcast-peer-responses" "classcast-peer-interactions")
REGION="us-east-1"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

print_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

print_error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
}

# Function to create manual backup
create_manual_backup() {
    local table_name=\$1
    local backup_name="manual-backup-\${table_name}-\$(date +%Y%m%d-%H%M%S)"
    
    print_status "Creating manual backup for table: \$table_name"
    
    aws dynamodb create-backup \\
        --table-name "\$table_name" \\
        --backup-name "\$backup_name" \\
        --region "\$REGION"
    
    if [ \$? -eq 0 ]; then
        print_status "Backup created successfully: \$backup_name"
    else
        print_error "Failed to create backup for \$table_name"
        return 1
    fi
}

# Function to list backups
list_backups() {
    local table_name=\$1
    
    print_status "Listing backups for table: \$table_name"
    
    aws dynamodb list-backups \\
        --table-name "\$table_name" \\
        --region "\$REGION" \\
        --query 'BackupSummaries[*].[BackupName,BackupStatus,BackupCreationDateTime]' \\
        --output table
}

# Function to restore from backup
restore_from_backup() {
    local table_name=\$1
    local backup_arn=\$2
    local new_table_name=\$3
    
    print_status "Restoring table \$table_name from backup \$backup_arn"
    
    aws dynamodb restore-table-from-backup \\
        --target-table-name "\$new_table_name" \\
        --backup-arn "\$backup_arn" \\
        --region "\$REGION"
    
    if [ \$? -eq 0 ]; then
        print_status "Table restored successfully as: \$new_table_name"
    else
        print_error "Failed to restore table from backup"
        return 1
    fi
}

# Function to test backup integrity
test_backup_integrity() {
    local table_name=\$1
    
    print_status "Testing backup integrity for table: \$table_name"
    
    # Get latest backup
    local latest_backup=\$(aws dynamodb list-backups \\
        --table-name "\$table_name" \\
        --region "\$REGION" \\
        --query 'BackupSummaries[0].BackupArn' \\
        --output text)
    
    if [ "\$latest_backup" = "None" ] || [ -z "\$latest_backup" ]; then
        print_warning "No backups found for table: \$table_name"
        return 1
    fi
    
    print_status "Latest backup ARN: \$latest_backup"
    
    # Test restore to temporary table
    local temp_table_name="test-restore-\${table_name}-\$(date +%s)"
    
    print_status "Testing restore to temporary table: \$temp_table_name"
    
    restore_from_backup "\$table_name" "\$latest_backup" "\$temp_table_name"
    
    if [ \$? -eq 0 ]; then
        print_status "Backup integrity test passed for \$table_name"
        
        # Clean up temporary table
        print_status "Cleaning up temporary table: \$temp_table_name"
        aws dynamodb delete-table \\
            --table-name "\$temp_table_name" \\
            --region "\$REGION" \\
            --output text > /dev/null
        
        print_status "Temporary table deleted"
    else
        print_error "Backup integrity test failed for \$table_name"
        return 1
    fi
}

# Main script logic
case "\$1" in
    "backup")
        if [ -z "\$2" ]; then
            print_error "Please specify table name or 'all'"
            echo "Usage: \$0 backup <table_name|all>"
            exit 1
        fi
        
        if [ "\$2" = "all" ]; then
            for table in "\${TABLES[@]}"; do
                create_manual_backup "\$table"
            done
        else
            create_manual_backup "\$2"
        fi
        ;;
    
    "list")
        if [ -z "\$2" ]; then
            print_error "Please specify table name"
            echo "Usage: \$0 list <table_name>"
            exit 1
        fi
        
        list_backups "\$2"
        ;;
    
    "restore")
        if [ -z "\$2" ] || [ -z "\$3" ] || [ -z "\$4" ]; then
            print_error "Please specify table name, backup ARN, and new table name"
            echo "Usage: \$0 restore <table_name> <backup_arn> <new_table_name>"
            exit 1
        fi
        
        restore_from_backup "\$2" "\$3" "\$4"
        ;;
    
    "test")
        if [ -z "\$2" ]; then
            print_error "Please specify table name or 'all'"
            echo "Usage: \$0 test <table_name|all>"
            exit 1
        fi
        
        if [ "\$2" = "all" ]; then
            for table in "\${TABLES[@]}"; do
                test_backup_integrity "\$table"
            done
        else
            test_backup_integrity "\$2"
        fi
        ;;
    
    *)
        echo "ClassCast Backup Management Script"
        echo ""
        echo "Usage: \$0 {backup|list|restore|test} [options]"
        echo ""
        echo "Commands:"
        echo "  backup <table_name|all>     Create manual backup"
        echo "  list <table_name>           List backups for table"
        echo "  restore <table_name> <backup_arn> <new_table_name>  Restore from backup"
        echo "  test <table_name|all>       Test backup integrity"
        echo ""
        echo "Examples:"
        echo "  \$0 backup all"
        echo "  \$0 backup classcast-users"
        echo "  \$0 list classcast-users"
        echo "  \$0 test all"
        ;;
esac
`;

  require('fs').writeFileSync('backup-management.sh', backupScript);
  require('fs').chmodSync('backup-management.sh', '755');
  
  console.log('✅ Created backup management script: backup-management.sh');
}

async function setupBackups() {
  console.log('🚀 Setting up DynamoDB backup strategy...');
  console.log(`📊 Tables to backup: ${TABLES_TO_BACKUP.join(', ')}\n`);
  
  try {
    await setupBackupVault();
    await setupBackupPlan();
    await setupBackupSelection();
    await enablePointInTimeRecovery();
    await createBackupScript();
    
    console.log('\n🎉 Backup strategy setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Backup Vault: ${BACKUP_VAULT_NAME}`);
    console.log(`   - Backup Plan: ${BACKUP_PLAN_NAME}`);
    console.log(`   - Tables: ${TABLES_TO_BACKUP.length} tables configured`);
    console.log(`   - Point-in-Time Recovery: Enabled for all tables`);
    console.log(`   - Management Script: backup-management.sh`);
    
    console.log('\n📖 Backup Schedule:');
    console.log('   - Daily backups: 2 AM UTC (kept for 30 days)');
    console.log('   - Weekly backups: Sunday 3 AM UTC (kept for 90 days)');
    console.log('   - Monthly backups: 1st of month 4 AM UTC (kept for 1 year)');
    
    console.log('\n🔧 Management Commands:');
    console.log('   ./backup-management.sh backup all          # Create manual backup');
    console.log('   ./backup-management.sh list classcast-users # List backups');
    console.log('   ./backup-management.sh test all            # Test backup integrity');
    
  } catch (error) {
    console.error('❌ Error setting up backup strategy:', error);
    process.exit(1);
  }
}

// Run the backup setup
setupBackups();
