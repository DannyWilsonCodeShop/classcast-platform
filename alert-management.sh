#!/bin/bash

# ClassCast Alert Management Script
# This script provides manual alert testing and management

set -e

# Configuration
TOPIC_ARN="arn:aws:sns:us-east-1:463470937777:classcast-production-alerts"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_alert() {
    echo -e "${BLUE}[ALERT]${NC} $1"
}

# Function to test alert delivery
test_alert() {
    local severity=${1:-"INFO"}
    local message=${2:-"Test alert from ClassCast monitoring system"}
    
    print_alert "Sending test alert (Severity: $severity)"
    
    aws sns publish \
        --topic-arn "$TOPIC_ARN" \
        --message "{
            \"severity\": \"$severity\",
            \"message\": \"$message\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"source\": \"ClassCast-Monitoring\",
            \"environment\": \"Production\"
        }" \
        --subject "ClassCast Alert Test - $severity" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        print_status "Test alert sent successfully"
    else
        print_error "Failed to send test alert"
        return 1
    fi
}

# Function to list active alarms
list_alarms() {
    print_status "Listing active CloudWatch alarms..."
    
    aws cloudwatch describe-alarms \
        --alarm-names-prefix "ClassCast-" \
        --region "$REGION" \
        --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]' \
        --output table
}

# Function to get alarm history
get_alarm_history() {
    local alarm_name=$1
    local hours=${2:-24}
    
    if [ -z "$alarm_name" ]; then
        print_error "Please specify alarm name"
        echo "Usage: $0 history <alarm_name> [hours]"
        return 1
    fi
    
    print_status "Getting alarm history for $alarm_name (last $hours hours)..."
    
    local start_time=$(date -u -d "$hours hours ago" +%Y-%m-%dT%H:%M:%S)
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    aws cloudwatch get-metric-statistics \
        --namespace "ClassCast/API" \
        --metric-name "Errors" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 300 \
        --statistics Sum \
        --region "$REGION" \
        --output table
}

# Function to disable/enable alarms
toggle_alarm() {
    local alarm_name=$1
    local action=$2
    
    if [ -z "$alarm_name" ] || [ -z "$action" ]; then
        print_error "Please specify alarm name and action (enable/disable)"
        echo "Usage: $0 toggle <alarm_name> <enable|disable>"
        return 1
    fi
    
    if [ "$action" = "disable" ]; then
        print_status "Disabling alarm: $alarm_name"
        aws cloudwatch disable-alarm-actions \
            --alarm-names "$alarm_name" \
            --region "$REGION"
    elif [ "$action" = "enable" ]; then
        print_status "Enabling alarm: $alarm_name"
        aws cloudwatch enable-alarm-actions \
            --alarm-names "$alarm_name" \
            --region "$REGION"
    else
        print_error "Invalid action. Use 'enable' or 'disable'"
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Alarm $action operation completed"
    else
        print_error "Failed to $action alarm"
        return 1
    fi
}

# Function to get SNS topic statistics
get_topic_stats() {
    print_status "Getting SNS topic statistics..."
    
    aws cloudwatch get-metric-statistics \
        --namespace "AWS/SNS" \
        --metric-name "NumberOfMessagesPublished" \
        --dimensions Name=TopicName,Value=classcast-production-alerts \
        --start-time $(date -u -d "1 hour ago" +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Sum \
        --region "$REGION" \
        --output table
}

# Main script logic
case "$1" in
    "test")
        test_alert "$2" "$3"
        ;;
    
    "list")
        list_alarms
        ;;
    
    "history")
        get_alarm_history "$2" "$3"
        ;;
    
    "toggle")
        toggle_alarm "$2" "$3"
        ;;
    
    "stats")
        get_topic_stats
        ;;
    
    *)
        echo "ClassCast Alert Management Script"
        echo ""
        echo "Usage: $0 {test|list|history|toggle|stats} [options]"
        echo ""
        echo "Commands:"
        echo "  test [severity] [message]     Send test alert"
        echo "  list                          List active alarms"
        echo "  history <alarm_name> [hours]  Get alarm history"
        echo "  toggle <alarm_name> <action>  Enable/disable alarm"
        echo "  stats                         Get SNS topic statistics"
        echo ""
        echo "Examples:"
        echo "  $0 test CRITICAL 'Database connection failed'"
        echo "  $0 list"
        echo "  $0 history ClassCast-High-Error-Rate 48"
        echo "  $0 toggle ClassCast-High-Error-Rate disable"
        ;;
esac
