#!/usr/bin/env python3
"""
Data Validation Script for AI Pump Health Monitoring System
Validates the integrity and quality of generated data files
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys
from datetime import datetime

class DataValidator:
    def __init__(self, data_dir):
        self.data_dir = Path(data_dir)
        self.errors = []
        self.warnings = []
        
    def log_error(self, message):
        """Log validation errors"""
        self.errors.append(f"❌ ERROR: {message}")
        print(f"❌ ERROR: {message}")
        
    def log_warning(self, message):
        """Log validation warnings"""
        self.warnings.append(f"⚠️  WARNING: {message}")
        print(f"⚠️  WARNING: {message}")
        
    def log_success(self, message):
        """Log successful validations"""
        print(f"✅ SUCCESS: {message}")
        
    def validate_file_exists(self, filename):
        """Check if required files exist"""
        filepath = self.data_dir / filename
        if not filepath.exists():
            self.log_error(f"Required file missing: {filename}")
            return False
        else:
            self.log_success(f"File exists: {filename}")
            return True
            
    def validate_pump_master(self):
        """Validate pump master data"""
        print("\n🔍 Validating Pump Master Data...")
        
        if not self.validate_file_exists("pump_master.csv"):
            return
            
        try:
            df = pd.read_csv(self.data_dir / "pump_master.csv")
            
            # Check required columns
            required_cols = ['pump_id', 'pump_type', 'manufacturer', 'model', 
                           'installation_date', 'rated_power_kw', 'rated_flow_m3h', 'rated_head_m']
            
            for col in required_cols:
                if col not in df.columns:
                    self.log_error(f"Missing required column in pump_master.csv: {col}")
                    
            # Check for duplicates
            if df['pump_id'].duplicated().any():
                self.log_error("Duplicate pump_id found in pump_master.csv")
            else:
                self.log_success(f"No duplicate pump IDs ({len(df)} unique pumps)")
                
            # Check data types and ranges
            if df['rated_power_kw'].min() <= 0:
                self.log_error("Invalid rated_power_kw values (must be > 0)")
            if df['rated_flow_m3h'].min() <= 0:
                self.log_error("Invalid rated_flow_m3h values (must be > 0)")
                
            self.log_success(f"Pump master data validated: {len(df)} pumps")
            
        except Exception as e:
            self.log_error(f"Error reading pump_master.csv: {e}")
            
    def validate_operation_log(self):
        """Validate operational data"""
        print("\n🔍 Validating Operational Data...")
        
        if not self.validate_file_exists("operation_log.csv"):
            return
            
        try:
            df = pd.read_csv(self.data_dir / "operation_log.csv")
            
            # Check required columns
            required_cols = ['timestamp', 'pump_id', 'flow_rate_m3h', 'temperature_c', 
                           'vibration_x_mms', 'power_consumption_kw', 'status']
            
            for col in required_cols:
                if col not in df.columns:
                    self.log_error(f"Missing required column in operation_log.csv: {col}")
                    
            # Check timestamp format
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                self.log_success("Timestamp format is valid")
            except:
                self.log_error("Invalid timestamp format in operation_log.csv")
                
            # Check for missing values
            missing_pct = (df.isnull().sum() / len(df) * 100)
            for col, pct in missing_pct.items():
                if pct > 5:  # More than 5% missing
                    self.log_warning(f"High missing data in {col}: {pct:.1f}%")
                    
            # Check value ranges
            if df['temperature_c'].min() < 0 or df['temperature_c'].max() > 200:
                self.log_warning("Temperature values outside expected range (0-200°C)")
                
            if df['vibration_x_mms'].min() < 0:
                self.log_error("Negative vibration values found")
                
            self.log_success(f"Operational data validated: {len(df)} records")
            
        except Exception as e:
            self.log_error(f"Error reading operation_log.csv: {e}")
            
    def validate_maintenance_log(self):
        """Validate maintenance data"""
        print("\n🔍 Validating Maintenance Data...")
        
        if not self.validate_file_exists("maintenance_log.csv"):
            return
            
        try:
            df = pd.read_csv(self.data_dir / "maintenance_log.csv")
            
            # Check required columns
            required_cols = ['maintenance_id', 'pump_id', 'maintenance_date', 
                           'maintenance_type', 'cost_usd', 'downtime_hours']
            
            for col in required_cols:
                if col not in df.columns:
                    self.log_error(f"Missing required column in maintenance_log.csv: {col}")
                    
            # Check maintenance types
            valid_types = ['Preventive', 'Corrective', 'Emergency']
            invalid_types = df[~df['maintenance_type'].isin(valid_types)]
            if len(invalid_types) > 0:
                self.log_warning(f"Invalid maintenance types found: {invalid_types['maintenance_type'].unique()}")
                
            # Check cost and downtime ranges
            if df['cost_usd'].min() < 0:
                self.log_error("Negative maintenance costs found")
            if df['downtime_hours'].min() < 0:
                self.log_error("Negative downtime hours found")
                
            self.log_success(f"Maintenance data validated: {len(df)} records")
            
        except Exception as e:
            self.log_error(f"Error reading maintenance_log.csv: {e}")
            
    def validate_failure_data(self):
        """Validate failure data"""
        print("\n🔍 Validating Failure Data...")
        
        if not self.validate_file_exists("failure_data.csv"):
            return
            
        try:
            df = pd.read_csv(self.data_dir / "failure_data.csv")
            
            # Check required columns
            required_cols = ['failure_id', 'pump_id', 'failure_date', 
                           'failure_type', 'severity', 'repair_cost_usd']
            
            for col in required_cols:
                if col not in df.columns:
                    self.log_error(f"Missing required column in failure_data.csv: {col}")
                    
            # Check severity levels
            valid_severity = ['Low', 'Medium', 'High', 'Critical']
            invalid_severity = df[~df['severity'].isin(valid_severity)]
            if len(invalid_severity) > 0:
                self.log_warning(f"Invalid severity levels found: {invalid_severity['severity'].unique()}")
                
            self.log_success(f"Failure data validated: {len(df)} records")
            
        except Exception as e:
            self.log_error(f"Error reading failure_data.csv: {e}")
            
    def validate_test_scenarios(self):
        """Validate test scenarios data"""
        print("\n🔍 Validating Test Scenarios...")
        
        if not self.validate_file_exists("test_scenarios.csv"):
            return
            
        try:
            df = pd.read_csv(self.data_dir / "test_scenarios.csv")
            
            # Check confidence scores
            if df['confidence_score'].min() < 0 or df['confidence_score'].max() > 1:
                self.log_error("Confidence scores must be between 0 and 1")
                
            self.log_success(f"Test scenarios validated: {len(df)} records")
            
        except Exception as e:
            self.log_error(f"Error reading test_scenarios.csv: {e}")
            
    def cross_validate_data(self):
        """Cross-validate data consistency across files"""
        print("\n🔍 Cross-Validating Data Consistency...")
        
        try:
            # Load all data files
            pump_master = pd.read_csv(self.data_dir / "pump_master.csv")
            operation_log = pd.read_csv(self.data_dir / "operation_log.csv")
            maintenance_log = pd.read_csv(self.data_dir / "maintenance_log.csv")
            failure_data = pd.read_csv(self.data_dir / "failure_data.csv")
            
            # Get pump IDs from each file
            master_pumps = set(pump_master['pump_id'])
            operation_pumps = set(operation_log['pump_id'])
            maintenance_pumps = set(maintenance_log['pump_id'])
            failure_pumps = set(failure_data['pump_id'])
            
            # Check if operational data pumps exist in master
            orphan_operation = operation_pumps - master_pumps
            if orphan_operation:
                self.log_error(f"Operational data contains pump IDs not in master: {orphan_operation}")
                
            # Check if maintenance pumps exist in master
            orphan_maintenance = maintenance_pumps - master_pumps
            if orphan_maintenance:
                self.log_error(f"Maintenance data contains pump IDs not in master: {orphan_maintenance}")
                
            # Check if failure pumps exist in master
            orphan_failure = failure_pumps - master_pumps
            if orphan_failure:
                self.log_error(f"Failure data contains pump IDs not in master: {orphan_failure}")
                
            if not (orphan_operation or orphan_maintenance or orphan_failure):
                self.log_success("All pump IDs are consistent across files")
                
        except Exception as e:
            self.log_error(f"Error during cross-validation: {e}")
            
    def generate_report(self):
        """Generate validation summary report"""
        print("\n" + "="*60)
        print("📊 DATA VALIDATION SUMMARY REPORT")
        print("="*60)
        
        total_errors = len(self.errors)
        total_warnings = len(self.warnings)
        
        if total_errors == 0 and total_warnings == 0:
            print("🎉 ALL VALIDATIONS PASSED!")
            print("   Data is ready for AI model training")
        else:
            print(f"📊 Validation Results:")
            print(f"   - Errors: {total_errors}")
            print(f"   - Warnings: {total_warnings}")
            
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"   {error}")
                
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   {warning}")
                
        # Data statistics
        try:
            pump_master = pd.read_csv(self.data_dir / "pump_master.csv")
            operation_log = pd.read_csv(self.data_dir / "operation_log.csv")
            
            print(f"\n📈 DATA STATISTICS:")
            print(f"   - Total Pumps: {len(pump_master)}")
            print(f"   - Operational Records: {len(operation_log):,}")
            print(f"   - Date Range: {operation_log['timestamp'].min()} to {operation_log['timestamp'].max()}")
            
        except:
            pass
            
        return total_errors == 0
        
    def run_all_validations(self):
        """Run all validation checks"""
        print("🚀 Starting Data Validation...")
        print(f"📁 Data Directory: {self.data_dir}")
        print("-" * 60)
        
        self.validate_pump_master()
        self.validate_operation_log()
        self.validate_maintenance_log()
        self.validate_failure_data()
        self.validate_test_scenarios()
        self.cross_validate_data()
        
        return self.generate_report()

def main():
    """Main validation function"""
    # Set data directory
    data_dir = Path(__file__).parent.parent / "data" / "raw"
    
    # Create validator
    validator = DataValidator(data_dir)
    
    # Run validations
    success = validator.run_all_validations()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()