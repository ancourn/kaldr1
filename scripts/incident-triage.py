#!/usr/bin/env python3
# scripts/incident-triage.py
import json
import requests
import time
import os
import subprocess
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IncidentTriage:
    def __init__(self):
        self.prometheus_url = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
        self.alertmanager_url = os.getenv('ALERTMANAGER_URL', 'http://alertmanager:9093')
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK')
        self.pagerduty_service_key = os.getenv('PAGERDUTY_SERVICE_KEY', '')
        
    def query_prometheus(self, query: str) -> List[Dict]:
        """Query Prometheus for metrics"""
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/query", 
                                 params={'query': query}, timeout=10)
            response.raise_for_status()
            return response.json()['data']['result']
        except Exception as e:
            logger.error(f"Prometheus query failed: {e}")
            return []
    
    def get_active_alerts(self) -> List[Dict]:
        """Get active alerts from Alertmanager"""
        try:
            response = requests.get(f"{self.alertmanager_url}/api/v1/alerts", timeout=10)
            response.raise_for_status()
            return response.json()['data']
        except Exception as e:
            logger.error(f"Failed to get alerts: {e}")
            return []
    
    def triage_incident(self, alert: Dict) -> Dict:
        """Triage an incident based on alert data"""
        alertname = alert.get('labels', {}).get('alertname', '')
        severity = alert.get('labels', {}).get('severity', 'warning')
        service = alert.get('labels', {}).get('service', 'unknown')
        
        # Define triage rules
        triage_rules = {
            'ServiceDown': {
                'priority': 'critical',
                'auto_recovery': True,
                'recovery_script': './scripts/auto-recover-api.sh',
                'escalation_delay': 300,  # 5 minutes
                'channels': ['#incident-response', '#backend-emergency']
            },
            'HighErrorRate': {
                'priority': 'high',
                'auto_recovery': False,
                'investigation_required': True,
                'escalation_delay': 600,  # 10 minutes
                'channels': ['#incident-response']
            },
            'DatabaseDown': {
                'priority': 'critical',
                'auto_recovery': True,
                'recovery_script': './scripts/auto-recover-database.sh',
                'escalation_delay': 300,  # 5 minutes
                'channels': ['#incident-response', '#devops-emergency']
            },
            'BlockchainNodeDown': {
                'priority': 'critical',
                'auto_recovery': True,
                'recovery_script': './scripts/auto-recover-blockchain.sh',
                'escalation_delay': 300,  # 5 minutes
                'channels': ['#incident-response', '#blockchain-emergency']
            },
            'SecurityAlert': {
                'priority': 'critical',
                'auto_recovery': False,
                'investigation_required': True,
                'escalation_delay': 60,  # 1 minute
                'channels': ['#incident-response', '#security-emergency']
            }
        }
        
        return triage_rules.get(alertname, {
            'priority': severity,
            'auto_recovery': False,
            'investigation_required': True,
            'escalation_delay': 900,  # 15 minutes
            'channels': ['#incident-response']
        })
    
    def send_slack_notification(self, message: str, channel: str = "#incident-response") -> bool:
        """Send notification to Slack"""
        payload = {
            'channel': channel,
            'text': message,
            'username': 'Incident Bot',
            'icon_emoji': ':warning:'
        }
        
        try:
            response = requests.post(self.slack_webhook, 
                                   json=payload, 
                                   timeout=10)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
            return False
    
    def send_pagerduty_alert(self, description: str, severity: str = 'critical') -> bool:
        """Send alert to PagerDuty"""
        if not self.pagerduty_service_key:
            logger.warning("PagerDuty service key not configured")
            return False
            
        payload = {
            'service_key': self.pagerduty_service_key,
            'incident_key': f'kaldr1-{datetime.now().isoformat()}',
            'event_type': 'trigger',
            'description': description,
            'client': 'KALDRIX Incident Triage',
            'client_url': 'https://grafana.kaldr1.com',
            'details': {
                'severity': severity,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        try:
            response = requests.post('https://events.pagerduty.com/generic/2010-04-15/create_event.json',
                                   json=payload, timeout=10)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"PagerDuty alert failed: {e}")
            return False
    
    def run_auto_recovery(self, recovery_script: str) -> bool:
        """Run auto-recovery script"""
        try:
            result = subprocess.run([recovery_script], 
                                  capture_output=True, 
                                  text=True,
                                  timeout=300,
                                  cwd='/home/z/my-project')
            
            if result.returncode == 0:
                logger.info(f"Auto-recovery successful: {result.stdout}")
                return True
            else:
                logger.error(f"Auto-recovery failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Auto-recovery execution failed: {e}")
            return False
    
    def create_incident_ticket(self, alert: Dict, triage: Dict) -> str:
        """Create incident ticket in tracking system"""
        # This is a placeholder - implement based on your ticket system
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(self.get_active_alerts())}"
        
        # Log incident creation
        logger.info(f"Created incident ticket: {incident_id}")
        return incident_id
    
    def process_alert(self, alert: Dict) -> None:
        """Process a single alert"""
        alertname = alert.get('labels', {}).get('alertname', 'Unknown')
        severity = alert.get('labels', {}).get('severity', 'warning')
        service = alert.get('labels', {}).get('service', 'unknown')
        
        logger.info(f"Processing alert: {alertname}")
        
        # Triage the incident
        triage = self.triage_incident(alert)
        
        # Create incident ticket
        incident_id = self.create_incident_ticket(alert, triage)
        
        # Send initial notification to all relevant channels
        for channel in triage.get('channels', ['#incident-response']):
            message = f"🚨 *Incident Alert* 🚨\n"
            message += f"*Incident ID:* {incident_id}\n"
            message += f"*Alert:* {alertname}\n"
            message += f"*Severity:* {triage['priority'].upper()}\n"
            message += f"*Service:* {service}\n"
            message += f"*Auto-recovery:* {'✅ Enabled' if triage.get('auto_recovery') else '❌ Disabled'}\n"
            message += f"*Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            self.send_slack_notification(message, channel)
        
        # Attempt auto-recovery if configured
        if triage.get('auto_recovery') and triage.get('recovery_script'):
            logger.info(f"Attempting auto-recovery with: {triage['recovery_script']}")
            
            # Send recovery attempt notification
            recovery_message = f"🔧 *Attempting Auto-Recovery* 🔧\n"
            recovery_message += f"*Incident ID:* {incident_id}\n"
            recovery_message += f"*Script:* {triage['recovery_script']}\n"
            recovery_message += f"*Status:* In Progress"
            
            for channel in triage.get('channels', ['#incident-response']):
                self.send_slack_notification(recovery_message, channel)
            
            success = self.run_auto_recovery(triage['recovery_script'])
            
            if success:
                success_message = f"✅ *Auto-Recovery Successful* ✅\n"
                success_message += f"*Incident ID:* {incident_id}\n"
                success_message += f"*Alert:* {alertname}\n"
                success_message += f"*Status:* Resolved"
                
                for channel in triage.get('channels', ['#incident-response']):
                    self.send_slack_notification(success_message, channel)
            else:
                failure_message = f"❌ *Auto-Recovery Failed* ❌\n"
                failure_message += f"*Incident ID:* {incident_id}\n"
                failure_message += f"*Alert:* {alertname}\n"
                failure_message += f"*Status:* Manual Intervention Required\n"
                failure_message += f"*Next Action:* Escalating to on-call team"
                
                for channel in triage.get('channels', ['#incident-response']):
                    self.send_slack_notification(failure_message, channel)
                
                # Escalate to PagerDuty for critical incidents
                if triage.get('priority') == 'critical':
                    pagerduty_description = f"Critical incident requiring immediate attention: {alertname} affecting {service}"
                    self.send_pagerduty_alert(pagerduty_description, triage['priority'])
    
    def process_alerts(self) -> None:
        """Process all active alerts"""
        alerts = self.get_active_alerts()
        
        if not alerts:
            logger.debug("No active alerts found")
            return
        
        logger.info(f"Processing {len(alerts)} active alerts")
        
        for alert in alerts:
            try:
                self.process_alert(alert)
            except Exception as e:
                logger.error(f"Error processing alert: {e}")
                continue

def main():
    """Main incident triage loop"""
    triage = IncidentTriage()
    
    logger.info("Starting KALDRIX Incident Triage System")
    
    try:
        while True:
            try:
                triage.process_alerts()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Shutting down incident triage...")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(60)
    except Exception as e:
        logger.error(f"Fatal error in incident triage: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())